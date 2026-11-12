/**
 * Seed aatrend categories + site-content defaults — ADDITIVE ONLY.
 * Usage: MONGO_TUNNEL=1 node scripts/seed-content.mjs
 * Re-runnable: categories are upserted by slug (admin edits to image/text
 * are kept — only missing categories are created); SiteSettings fields are
 * filled only when missing/empty, never overwriting admin edits.
 * Products, orders, coupons and the flash sale / hero slides are untouched.
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

const U = (id, w = 800) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const MAIN_CATEGORIES = [
  { name: "Fashion", image: U("photo-1445205170230-053b83016050"), tagline: "Trending styles", order: 0 },
  { name: "Electronics", image: U("photo-1498049794561-7780e7231661"), tagline: "Gadgets & audio", order: 1 },
  { name: "Beauty", image: U("photo-1596462502278-27bfdc403348"), tagline: "Makeup & care", order: 2 },
  { name: "Fitness", image: U("photo-1571019613454-1cb2f99b2d8b"), tagline: "Active wear & gear", order: 3 },
  { name: "Home Decor", image: U("photo-1586023492125-27b2c045efd7"), tagline: "For your space", order: 4 },
  { name: "Accessories", image: U("photo-1611591437281-460bfbe1220a"), tagline: "Finishing touches", order: 5 },
];

const SUBCATEGORIES = ["Women's", "Tshirts", "Top", "Shirts", "Jackets", "Hoodies", "Bag", "Accessories"];

const DEFAULT_PAGES = {
  about: {
    title: "About aatrend",
    content: `aatrend is a modern online store built for people who love discovering great products. From fashion and electronics to beauty, fitness, home decor and accessories, every item in our catalogue is hand-picked for quality, style and value.

We believe shopping should be simple, safe and fun: delivery ৳70 inside Dhaka and ৳120 outside Dhaka, secure checkout, easy 30-day returns and 24/7 support on every order.

Our team curates new arrivals every week, so there is always something fresh to discover — whether you are refreshing your wardrobe, upgrading your home, or finding the perfect gift.`,
  },
  contact: {
    title: "Contact Us",
    content: `We would love to hear from you. Send us a message with the form and we will reply within one business day.

You can also reach us by email or visit us in Dhaka, Bangladesh. For order questions, please include your order number so we can help faster.`,
  },
  terms: {
    title: "Terms & Conditions",
    content: `Welcome to aatrend. By placing an order on this store you agree to the terms below.

Orders and payment: All prices are in Bangladeshi Taka (৳). We accept cash on delivery and demo card payments at checkout. An order is confirmed once you receive an order number.

Shipping: Delivery charge is ৳70 inside Dhaka and ৳120 outside Dhaka. Orders are usually dispatched within 2 business days and delivered within 3–7 business days.

Returns: You can return unused items within 30 days of delivery for a refund or exchange. Sale items are final sale unless faulty.

Privacy: We only use your contact details to fulfil your order and to reply to your messages. We never sell your personal information.

If you have any questions about these terms, please contact us.`,
  },
};

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const DEFAULT_TRUST_BADGES = [
  { icon: "🚚", title: "Free Shipping", sub: "On selected products" },
  { icon: "🔒", title: "Secure Payments", sub: "100% secure checkout" },
  { icon: "↩️", title: "Easy Returns", sub: "30-day return policy" },
  { icon: "🎧", title: "24/7 Support", sub: "Always here to help" },
];

const DEFAULT_PROMO_TILES = [
  {
    image: U("photo-1483985988355-763728e1935b"),
    title: "GET THE HOTTEST STYLES",
    subtitle: "AT 70% OFF!",
    buttonText: "Shop Now",
    buttonLink: "/shop?onSale=1",
    bg: "",
    active: true,
    order: 0,
  },
  {
    image: "",
    title: "LAST CHANCE",
    subtitle: "UP TO 60% OFF",
    buttonText: "Shop Sale",
    buttonLink: "/shop?onSale=1",
    bg: "#5ec8b8",
    active: true,
    order: 1,
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "novatrend", bufferCommands: false });
  console.log("connected to aatrend db");

  const categorySchema = new mongoose.Schema({}, { strict: false, collection: "categories" });
  const Category = mongoose.models.Category ?? mongoose.model("Category", categorySchema);
  const productSchema = new mongoose.Schema({}, { strict: false, collection: "products" });
  const Product = mongoose.models.Product ?? mongoose.model("Product", productSchema);

  // Main categories — create only when the slug is missing.
  for (const c of MAIN_CATEGORIES) {
    const r = await Category.updateOne(
      { slug: slugify(c.name), group: "category" },
      {
        $setOnInsert: {
          name: c.name,
          slug: slugify(c.name),
          image: c.image,
          tagline: c.tagline,
          description: "",
          group: "category",
          order: c.order,
          active: true,
        },
      },
      { upsert: true }
    );
    console.log(`category ${c.name}: ${r.upsertedCount ? "created" : "already there"}`);
  }

  // Fashion sub-categories — image from the first product of that
  // sub-category, so tiles show a real product photo.
  for (const [i, name] of SUBCATEGORIES.entries()) {
    const p = await Product.findOne({ subcategory: name }).sort({ createdAt: -1 }).lean();
    const image = p?.images?.[0] ?? U("photo-1445205170230-053b83016050");
    const r = await Category.updateOne(
      { slug: slugify(name), group: "subcategory" },
      {
        $setOnInsert: {
          name,
          slug: slugify(name),
          image,
          tagline: "",
          description: "",
          group: "subcategory",
          order: i,
          active: true,
        },
      },
      { upsert: true }
    );
    console.log(`subcategory ${name}: ${r.upsertedCount ? "created" : "already there"}`);
  }

  // Site content defaults — fill only missing/empty fields.
  const settingsSchema = new mongoose.Schema({}, { strict: false, collection: "sitesettings" });
  const SiteSettings = mongoose.models.SiteSettings ?? mongoose.model("SiteSettings", settingsSchema);
  const doc = await SiteSettings.findOne({ key: "site" }).lean();
  if (!doc) {
    console.log("no site settings doc — run scripts/seed-settings.mjs first");
  } else {
    const fill = {};
    if (!doc.announcementBar) fill.announcementBar = { active: false, text: "", link: "/shop" };
    if (!Array.isArray(doc.trustBadges) || doc.trustBadges.length === 0) fill.trustBadges = DEFAULT_TRUST_BADGES;
    const hd = doc.headings ?? {};
    if (!hd.categoriesTitle || !hd.newArrivalsTitle || !hd.bestSellersTitle) {
      fill.headings = {
        categoriesTitle: hd.categoriesTitle || "Shop by Categories",
        newArrivalsTitle: hd.newArrivalsTitle || "New Arrivals",
        bestSellersTitle: hd.bestSellersTitle || "Best Sellers",
      };
    }
    const ft = doc.footer ?? {};
    if (!ft.aboutText) {
      fill.footer = {
        aboutText: "Shop the latest trending products curated for modern lifestyles. Loved by 50,000+ customers worldwide.",
        copyrightText: ft.copyrightText || "",
      };
    }
    if (!Array.isArray(doc.promoTiles) || doc.promoTiles.length === 0) fill.promoTiles = DEFAULT_PROMO_TILES;
    if (Object.keys(fill).length > 0) {
      await SiteSettings.updateOne({ key: "site" }, { $set: fill });
      console.log("site content defaults filled:", Object.keys(fill).join(", "));
    } else {
      console.log("site content already set — nothing overwritten");
    }
  }

  // Content pages — create only if missing, never overwrite admin edits.
  const pageSchema = new mongoose.Schema({}, { strict: false, collection: "pages" });
  const Page = mongoose.models.SeedPage ?? mongoose.model("SeedPage", pageSchema);
  for (const [slug, p] of Object.entries(DEFAULT_PAGES)) {
    const r = await Page.updateOne(
      { slug },
      { $setOnInsert: { slug, title: p.title, content: p.content } },
      { upsert: true }
    );
    console.log(`page ${slug}: ${r.upsertedCount ? "created" : "already there"}`);
  }

  await mongoose.disconnect();
  console.log("seed-content done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
