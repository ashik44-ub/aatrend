/**
 * One-off cleanup for the coupon order test (NT-MWA3G7V7504).
 * Deletes the test order and restores stock + coupon usage.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import dns from "node:dns";

if (process.env.MONGO_TUNNEL === "1") {
  const map = {
    "ac-0ijthm1-shard-00-00.sn0hlah.mongodb.net": "127.0.0.2",
    "ac-0ijthm1-shard-00-01.sn0hlah.mongodb.net": "127.0.0.3",
    "ac-0ijthm1-shard-00-02.sn0hlah.mongodb.net": "127.0.0.4",
  };
  const orig = dns.lookup.bind(dns);
  dns.lookup = ((hostname, options, callback) => {
    const target = map[hostname];
    if (target) {
      const cb = typeof options === "function" ? options : callback;
      if (typeof cb === "function") {
        if (options && typeof options === "object" && options.all) cb(null, [{ address: target, family: 4 }]);
        else cb(null, target, 4);
        return;
      }
    }
    return orig(hostname, options, callback);
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: "novatrend", bufferCommands: false });
const db = mongoose.connection.db;
const order = await db.collection("orders").findOne({ orderNumber: "NT-MWA3G7V7504" });
console.log("test order found:", !!order, order ? `discount=${order.discount} total=${order.total} coupon=${order.couponCode}` : "");
const couponBefore = await db.collection("coupons").findOne({ code: "WELCOME10" });
console.log("WELCOME10 usedCount after order:", couponBefore?.usedCount);
const od = await db.collection("orders").deleteOne({ orderNumber: "NT-MWA3G7V7504" });
await db.collection("products").updateOne({ slug: "essential-hoodie" }, { $inc: { stock: 1, sold: -1 } });
await db.collection("coupons").updateOne({ code: "WELCOME10" }, { $inc: { usedCount: -1 } });
const couponAfter = await db.collection("coupons").findOne({ code: "WELCOME10" });
console.log("cleaned order:", od.deletedCount, "| WELCOME10 usedCount restored to:", couponAfter?.usedCount);
console.log("counts products/orders:", await db.collection("products").countDocuments(), await db.collection("orders").countDocuments());
await mongoose.disconnect();
