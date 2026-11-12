/**
 * One-time migration: US dollars ($) -> Bangladeshi Taka (৳) at ৳120 per $1.
 * Usage: MONGO_TUNNEL=1 node scripts/migrate-to-taka.mjs
 *
 * - Products: any product still priced in dollars (price < 1000 — the dollar
 *   catalogue is $11–$550, Taka prices are ৳1,320–৳66,000, so there is no
 *   overlap) gets price / comparePrice / priceTo multiplied by 120 and
 *   rounded. Safe to re-run: already-converted products are skipped.
 * - Fixed-amount coupons: value / minOrder converted the same way.
 * - Content: the live Terms page ("US dollars" -> "Bangladeshi Taka (৳)")
 *   and the stored trust-badge "over $50" text are corrected, because the
 *   content seed only fills missing values and never overwrites them.
 * - Shipping rates (৳70/৳120) and existing orders are NOT touched.
 */
import mongoose from "mongoose";
import dns from "node:dns";
import fs from "node:fs";

const RATE = 120;
const toTaka = (v) => Math.round(v * RATE);

if (process.env.MONGO_TUNNEL === "1") {
  const map = {
    "ac-0ijthm1-shard-00-00.sn0hlah.mongodb.net": "127.0.0.2",
    "ac-0ijthm1-shard-00-01.sn0hlah.mongodb.net": "127.0.0.3",
    "ac-0ijthm1-shard-00-02.sn0hlah.mongodb.net": "127.0.0.4",
    "ac-a0nip1k-shard-00-00.avcuhzc.mongodb.net": "127.0.0.5",
    "ac-a0nip1k-shard-00-01.avcuhzc.mongodb.net": "127.0.0.6",
    "ac-a0nip1k-shard-00-02.avcuhzc.mongodb.net": "127.0.0.7",
  };
  const orig = dns.lookup.bind(dns);
  dns.lookup = (hostname, options, callback) => {
    const target = map[hostname];
    const cb = typeof options === "function" ? options : callback;
    if (target && typeof cb === "function") {
      if (options && typeof options === "object" && options.all) cb(null, [{ address: target, family: 4 }]);
      else cb(null, target, 4);
      return;
    }
    return orig(hostname, options, callback);
  };
}

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

async function main() {
  await mongoose.connect(env.MONGODB_URI, { dbName: "novatrend", bufferCommands: false });
  const Product = mongoose.model("MigProduct", new mongoose.Schema({}, { strict: false }), "products");
  const Coupon = mongoose.model("MigCoupon", new mongoose.Schema({}, { strict: false }), "coupons");
  const Page = mongoose.model("MigPage", new mongoose.Schema({}, { strict: false }), "pages");
  const SiteSettings = mongoose.model("MigSettings", new mongoose.Schema({}, { strict: false }), "sitesettings");

  // --- Products still in dollars ---
  const products = await Product.find({ price: { $lt: 1000 } }).select("slug price comparePrice priceTo").lean();
  console.log(`dollar-priced products found: ${products.length}`);
  for (const p of products) {
    const update = { price: toTaka(p.price) };
    if (p.comparePrice) update.comparePrice = toTaka(p.comparePrice);
    if (p.priceTo) update.priceTo = toTaka(p.priceTo);
    await Product.updateOne({ _id: p._id }, { $set: update });
    console.log(`  ${p.slug}: $${p.price} -> ৳${update.price}`);
  }

  // --- Fixed-amount coupons still in dollars ---
  const coupons = await Coupon.find({ type: "fixed" }).lean();
  for (const c of coupons) {
    const update = {};
    if (c.value > 0 && c.value < 1000) update.value = toTaka(c.value);
    if (c.minOrder > 0 && c.minOrder < 1000) update.minOrder = toTaka(c.minOrder);
    if (Object.keys(update).length > 0) {
      await Coupon.updateOne({ _id: c._id }, { $set: update });
      console.log(`  coupon ${c.code}: converted`, update);
    }
  }
  if (coupons.length === 0) console.log("  no fixed coupons in DB (WELCOME10/FLASH20 are percent)");

  // --- Live Terms page text ---
  const terms = await Page.findOne({ slug: "terms" }).lean();
  if (terms?.content?.includes("US dollars")) {
    await Page.updateOne(
      { slug: "terms" },
      { $set: { content: terms.content.replace("All prices are in US dollars.", "All prices are in Bangladeshi Taka (৳).") } }
    );
    console.log("  terms page: 'US dollars' -> 'Bangladeshi Taka (৳)'");
  } else {
    console.log("  terms page: already in Taka");
  }

  // --- Stored trust badges ---
  const settings = await SiteSettings.findOne({ key: "site" }).lean();
  const badges = settings?.trustBadges;
  if (Array.isArray(badges)) {
    const fixed = badges.map((b) =>
      typeof b?.sub === "string" && b.sub.includes("$50") ? { ...b, sub: "On selected products" } : b
    );
    if (JSON.stringify(fixed) !== JSON.stringify(badges)) {
      await SiteSettings.updateOne({ key: "site" }, { $set: { trustBadges: fixed } });
      console.log("  trust badges: '$50' text -> 'On selected products'");
    } else {
      console.log("  trust badges: already clean");
    }
  }

  const remaining = await Product.countDocuments({ price: { $lt: 1000 } });
  console.log(`products still in dollars: ${remaining}`);
  console.log(`total products: ${await Product.countDocuments()}, orders: ${await mongoose.connection.db.collection("orders").countDocuments()}`);
  await mongoose.disconnect();
  console.log("migrate-to-taka done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
