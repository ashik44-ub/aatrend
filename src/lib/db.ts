import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.__mongoose ?? {
  conn: null,
  promise: null,
};
globalWithMongoose.__mongoose = cached;

/**
 * Sandbox-only MongoDB tunnel support (moved here from the deleted
 * instrumentation file — Next.js compiles that file for the
 * Edge Runtime, which flooded the dev log with a node:dns warning on
 * every request even though the file declared `runtime = "nodejs"`).
 *
 * In this dev sandbox, direct TCP to Atlas is intercepted by the egress
 * proxy, so the app can only reach Atlas through the local CONNECT tunnel
 * (scripts/mongo-tunnel.mjs). Atlas routes by TLS SNI, so the real shard
 * hostnames must be used — this patch maps them to the tunnel's loopback
 * addresses (127.0.0.2/3/4) at DNS level.
 *
 * Runs in the Node.js runtime only (this module is imported by API routes
 * and server components), lazily, once, before the first connect.
 * Only active when MONGO_TUNNEL=1. Never enabled in production.
 */
let tunnelDnsPatched = false;

async function ensureTunnelDnsPatch(): Promise<void> {
  if (tunnelDnsPatched) return;
  if (process.env.MONGO_TUNNEL !== "1") return;
  tunnelDnsPatched = true;
  const dnsMod = await import("node:dns");
  // Use the CJS exports object (mutable) rather than the frozen ESM namespace.
  const dns = (dnsMod as unknown as { default?: typeof dnsMod }).default ?? dnsMod;
  const map: Record<string, string> = {
    "ac-0ijthm1-shard-00-00.sn0hlah.mongodb.net": "127.0.0.2",
    "ac-0ijthm1-shard-00-01.sn0hlah.mongodb.net": "127.0.0.3",
    "ac-0ijthm1-shard-00-02.sn0hlah.mongodb.net": "127.0.0.4",
    // Previous dev cluster (CineFreak) — reachable via scripts/mongo-tunnel-old.mjs.
    "ac-a0nip1k-shard-00-00.avcuhzc.mongodb.net": "127.0.0.5",
    "ac-a0nip1k-shard-00-01.avcuhzc.mongodb.net": "127.0.0.6",
    "ac-a0nip1k-shard-00-02.avcuhzc.mongodb.net": "127.0.0.7",
  };
  const origLookup = dns.lookup;
  (dns as unknown as { lookup: typeof dns.lookup }).lookup = ((
    hostname: string,
    options: unknown,
    callback?: unknown,
  ) => {
    const target = map[hostname];
    if (target) {
      const cb =
        typeof options === "function"
          ? (options as (...a: unknown[]) => void)
          : (callback as (...a: unknown[]) => void);
      const opts =
        typeof options === "object" && options !== null ? options : {};
      const family =
        typeof opts === "object" && (opts as { family?: number }).family
          ? (opts as { family?: number }).family
          : 4;
      if (typeof cb === "function") {
        if ((opts as { all?: boolean }).all) {
          cb(null, [{ address: target, family }]);
        } else {
          cb(null, target, family);
        }
        return;
      }
    }
    return (origLookup as (...a: unknown[]) => unknown).call(
      dns,
      hostname,
      options,
      callback,
    );
  }) as typeof dns.lookup;
}

/**
 * Connect to MongoDB, cached across hot reloads / concurrent requests.
 *
 * ROOT CAUSE of the cold-start 500 ("Cannot call `products.aggregate()`
 * before initial connection is complete"):
 * the old code did check → await patch → assign promise. Two concurrent
 * callers (Next.js renders layout + page in parallel on the very first
 * request) could both pass the `!cached.promise` check before either had
 * assigned it, so `mongoose.connect()` ran twice. The second call hits
 * Mongoose's early return in `openUri` ("already connecting, same URI")
 * and resolves IMMEDIATELY — before `conn.db` exists — so the caller's
 * `Product.aggregate()` threw. On a fast connection the topology event
 * usually fired first and hid the race; on a slow Atlas handshake it
 * surfaced every time.
 *
 * Fix: assign the promise SYNCHRONOUSLY (before any await) so every
 * concurrent caller shares the one in-flight connection attempt.
 * `bufferCommands` is left at its default (true): with buffering on, a
 * query issued before the connection opens simply waits for it instead
 * of throwing — the standard robust pattern for Next.js. If the first
 * attempt fails, the rejected promise is forgotten so a later request
 * can retry instead of re-throwing the stale error.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const attempt = (async () => {
      await ensureTunnelDnsPatch();
      return mongoose.connect(MONGODB_URI, { dbName: "novatrend" });
    })();
    // Assigned synchronously — concurrent callers share this one attempt.
    cached.promise = attempt;
    attempt.catch(() => {
      if (cached.promise === attempt) cached.promise = null;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
