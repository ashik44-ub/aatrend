import fs from "node:fs";
import mongoose from "mongoose";
import dns from "node:dns";

const map = {
  "ac-0ijthm1-shard-00-00.sn0hlah.mongodb.net": "127.0.0.2",
  "ac-0ijthm1-shard-00-01.sn0hlah.mongodb.net": "127.0.0.3",
  "ac-0ijthm1-shard-00-02.sn0hlah.mongodb.net": "127.0.0.4",
};
const orig = dns.lookup.bind(dns);
dns.lookup = ((h, o, cb) => {
  const t = map[h];
  if (t) {
    const c = typeof o === "function" ? o : cb;
    if (typeof c === "function") {
      if (o && typeof o === "object" && o.all) c(null, [{ address: t, family: 4 }]);
      else c(null, t, 4);
      return;
    }
  }
  return orig(h, o, cb);
});

for (const line of fs.readFileSync("/home/hatch/workspace/aatrend/.env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: "novatrend", bufferCommands: false });
const db = mongoose.connection.db;
const od = await db.collection("orders").deleteOne({ orderNumber: "NT-MW85BBV3921" });
const ud = await db.collection("users").deleteOne({ email: "testuser@example.com" });
const p = await db.collection("products").findOne({ slug: "essential-hoodie" });
const reviews = p.reviews.filter((r) => r.title !== "Test review");
const rating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
await db.collection("products").updateOne(
  { slug: "essential-hoodie" },
  { $set: { reviews, reviewCount: reviews.length, rating } }
);
await db.collection("products").updateOne({ slug: "essential-hoodie" }, { $inc: { stock: 2, sold: -2 } });
await db.collection("products").updateOne({ slug: "wireless-headphone" }, { $inc: { stock: 1, sold: -1 } });
console.log("cleaned:", JSON.stringify({ order: od.deletedCount, user: ud.deletedCount, reviews: reviews.length, rating }));
console.log(
  "counts:",
  await db.collection("products").countDocuments(),
  await db.collection("orders").countDocuments(),
  await db.collection("users").countDocuments()
);
await mongoose.disconnect();
