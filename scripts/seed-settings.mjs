/**
 * Seed aatrend site settings + coupons — ADDITIVE ONLY.
 * Usage: MONGO_TUNNEL=1 node scripts/seed-settings.mjs
 * Re-runnable: SiteSettings is created only if missing (admin edits are
 * never overwritten); coupons are upserted by code. Products/orders are
 * untouched — run scripts/seed.mjs for those.
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
        if (options && typeof options === "object" && options.all) {
          cb(null, [{ address: target, family: 4 }]);
        } else {
          cb(null, target, 4);
        }
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

const U = (id) => `https://images.unsplash.com/${id}?q=80&w=1600&auto=format&fit=crop`;

const DEFAULT_SLIDES = [
  {
    image: U("photo-1483985988355-763728e1935b"),
    title: "Discover Products You'll Love",
    subtitle: "Shop the latest trending products curated for modern lifestyles.",
    buttonText: "Shop Now",
    buttonLink: "/shop",
    order: 0,
  },
  {
    image: U("photo-1490481651871-ab68de25d43d"),
    title: "New Season Fashion Is Here",
    subtitle: "Fresh styles, bold colors and everyday essentials — up to 70% off in the flash sale.",
    buttonText: "Shop Fashion",
    buttonLink: "/shop?cat=Fashion",
    order: 1,
  },
  {
    image: U("photo-1441986300917-64674bd600d8"),
    title: "Everything You Need, One Store",
    subtitle: "Fashion, electronics, beauty and more — delivery ৳70 inside Dhaka, ৳120 outside Dhaka.",
    buttonText: "Explore Collection",
    buttonLink: "/shop?sort=newest",
    order: 2,
  },
];

const SUMMER_PICKS = [
  "summer-floral-dress",
  "oxford-cuban-shirt",
  "casual-mustard-shirt",
  "sleeve-round-t-shirt",
  "ribbed-knit-top",
  "flannel-collar-shirt",
  "high-waisted-pant",
  "womens-knit-sweater",
];

function defaultSummerSale(productIds) {
  return {
    active: true,
    title: "Summer Sale",
    subtitle: "Beat the heat with fresh summer styles",
    discountText: "Up To 50% Off",
    endsAt: new Date(Date.now() + 14 * 86400000),
    buttonText: "Shop Summer Sale",
    buttonLink: "/shop?sale=summer",
    bannerImage: U("photo-1523381210434-271e8be1f52b"),
    themeColor: "#f59e0b",
    productIds,
    categories: [],
  };
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "novatrend", bufferCommands: false });
  console.log("connected to aatrend db");

  const settingsSchema = new mongoose.Schema({}, { strict: false, collection: "sitesettings" });
  const SiteSettings =
    mongoose.models.SiteSettings ?? mongoose.model("SiteSettings", settingsSchema);

  // Summer picks: only slugs that actually exist (and are in stock).
  const productSchema = new mongoose.Schema({}, { strict: false, collection: "products" });
  const Product = mongoose.models.SeedProduct ?? mongoose.model("SeedProduct", productSchema);
  const found = await Product.find(
    { slug: { $in: SUMMER_PICKS }, stock: { $gt: 0 } },
    { slug: 1 }
  ).lean();
  const foundSlugs = new Set(found.map((p) => p.slug));
  const summerIds = SUMMER_PICKS.filter((s) => foundSlugs.has(s));

  const existing = await SiteSettings.findOne({ key: "site" }).lean();
  if (existing) {
    console.log("site settings already exist — keeping admin's current flash sale + hero slides");
    if (!existing.shipping) {
      await SiteSettings.updateOne(
        { key: "site", shipping: { $exists: false } },
        { $set: { shipping: { insideDhaka: 70, outsideDhaka: 120 } } }
      );
      console.log("shipping charges added (৳70 inside Dhaka, ৳120 outside Dhaka) — admin edits untouched");
    } else {
      console.log("shipping charges already set — keeping admin's current rates");
    }
    if (!existing.summerSale) {
      await SiteSettings.updateOne(
        { key: "site", summerSale: { $exists: false } },
        { $set: { summerSale: defaultSummerSale(summerIds) } }
      );
      console.log(`summer sale added (${summerIds.length} products, ends in 14 days) — admin edits untouched`);
    } else {
      console.log("summer sale already set — keeping admin's current summer sale");
    }
    if (!existing.freeShipping) {
      await SiteSettings.updateOne(
        { key: "site", freeShipping: { $exists: false } },
        { $set: { freeShipping: { active: false, allProducts: false, productIds: [] } } }
      );
      console.log("free shipping campaign added (inactive, no products) — admin edits untouched");
    } else {
      console.log("free shipping campaign already set — keeping admin's current campaign");
    }
  } else {
    await SiteSettings.create({
      key: "site",
      shipping: { insideDhaka: 70, outsideDhaka: 120 },
      freeShipping: { active: false, allProducts: false, productIds: [] },
      flashSale: {
        active: true,
        title: "Flash Sale",
        subtitle: "",
        discountText: "Up To 70% Off",
        endsAt: new Date(Date.now() + 3 * 86400000),
        buttonText: "Shop Sale Now",
        buttonLink: "/shop?onSale=1",
      },
      summerSale: defaultSummerSale(summerIds),
      heroSlides: DEFAULT_SLIDES,
    });
    console.log("site settings created: flash sale (ends in 3 days) + summer sale (ends in 14 days) + 3 hero slides");
  }

  const couponSchema = new mongoose.Schema({}, { strict: false, collection: "coupons" });
  const Coupon = mongoose.models.Coupon ?? mongoose.model("Coupon", couponSchema);

  await Coupon.updateOne(
    { code: "WELCOME10" },
    {
      $set: {
        code: "WELCOME10",
        type: "percent",
        value: 10,
        percent: 10,
        minOrder: 0,
        active: true,
      },
      $setOnInsert: { usedCount: 0 },
    },
    { upsert: true }
  );
  console.log("coupon WELCOME10 (10% off) ready");

  await Coupon.updateOne(
    { code: "FLASH20" },
    {
      $set: {
        code: "FLASH20",
        type: "percent",
        value: 20,
        percent: 20,
        minOrder: 0,
        expiresAt: new Date(Date.now() + 30 * 86400000),
        active: true,
      },
      $setOnInsert: { usedCount: 0 },
    },
    { upsert: true }
  );
  console.log("coupon FLASH20 (20% off, 30 days) ready");

  await mongoose.disconnect();
  console.log("seed-settings done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
