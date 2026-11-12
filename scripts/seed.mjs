/**
 * Seed aatrend with demo catalogue data.
 * Usage: node scripts/seed.mjs
 * Re-runnable: products/coupons/users are upserted by slug/code/email;
 * orders are seeded only when the orders collection is empty.
 * All image URLs are direct images.unsplash.com links — verify with:
 *   node scripts/verify-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import dns from "node:dns";
import bcrypt from "bcryptjs";

// Sandbox-only: map Atlas shard hostnames to the local CONNECT tunnel
// (scripts/mongo-tunnel.mjs). Only with MONGO_TUNNEL=1.
if (process.env.MONGO_TUNNEL === "1") {
  const map = {
    "ac-0ijthm1-shard-00-00.sn0hlah.mongodb.net": "127.0.0.2",
    "ac-0ijthm1-shard-00-01.sn0hlah.mongodb.net": "127.0.0.3",
    "ac-0ijthm1-shard-00-02.sn0hlah.mongodb.net": "127.0.0.4",
    // Previous dev cluster (CineFreak) — reachable via scripts/mongo-tunnel-old.mjs.
    "ac-a0nip1k-shard-00-00.avcuhzc.mongodb.net": "127.0.0.5",
    "ac-a0nip1k-shard-00-01.avcuhzc.mongodb.net": "127.0.0.6",
    "ac-a0nip1k-shard-00-02.avcuhzc.mongodb.net": "127.0.0.7",
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

// Minimal .env.local parser (no extra dependency). MONGODB_URI comes only
// from .env.local — to switch database, replace that one line (see README).
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const U = (id) => `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;
const C = (name, hex) => ({ name, hex });
const DAYS = (n) => new Date(Date.now() + n * 86400000);

const PRODUCTS = [
  // ---- Fashion ----
  {
    name: "Essential Hoodie", slug: "essential-hoodie", category: "Fashion", subcategory: "Hoodies",
    brand: "Adidas", price: 7199, comparePrice: 9599, stock: 42, rating: 4.8, sold: 320,
    colors: [C("Beige", "#d6c9b8"), C("Black", "#1f2937"), C("Grey", "#9ca3af")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: "hot",
    images: [U("photo-1556821840-3a63f95609a7"), U("photo-1509942774463-acf339cf87d5")],
    shortDescription: "Premium everyday hoodie — soft fleece, relaxed fit.",
    description: "Our best-selling Essential Hoodie is made from a soft cotton-blend fleece with a relaxed fit, kangaroo pocket and adjustable drawstring hood. Perfect for layering on cool days or lounging at home.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Beige" }, { type: "color", value: "Black" }, { type: "color", value: "Grey" }],
    featured: true, bestSeller: true, isNewArrival: true,
    specifications: [{ label: "Material", value: "80% Cotton, 20% Polyester" }, { label: "Fit", value: "Relaxed" }, { label: "Care", value: "Machine wash cold" }],
  },
  {
    name: "Air Max 270 Sneakers", slug: "air-max-270-sneakers", category: "Fashion",
    brand: "Nike", price: 15599, comparePrice: 19199, stock: 28, rating: 4.9, sold: 410,
    colors: [C("Red", "#ef4444"), C("White", "#f8fafc"), C("Black", "#1f2937")],
    sizes: ["US 7", "US 8", "US 9", "US 10"], status: "in_stock", badge: "hot",
    images: [U("photo-1542291026-7eec264c27ff"), U("photo-1600185365483-26d7a4cc7519")],
    shortDescription: "Iconic comfort meets modern style.",
    description: "The Air Max 270 delivers visible cushioning under every step. A breathable engineered mesh upper and the biggest heel Air unit yet make it an all-day comfort icon.",
    variants: [{ type: "size", value: "US 7" }, { type: "size", value: "US 8" }, { type: "size", value: "US 9" }, { type: "size", value: "US 10" }, { type: "color", value: "Red" }, { type: "color", value: "White" }, { type: "color", value: "Black" }],
    featured: true, bestSeller: true, isNewArrival: true,
    specifications: [{ label: "Upper", value: "Engineered mesh" }, { label: "Sole", value: "Foam + Air unit" }, { label: "Use", value: "Lifestyle / running" }],
  },
  {
    name: "Leather Biker Jacket", slug: "leather-biker-jacket", category: "Fashion", subcategory: "Jackets",
    brand: "D&G", price: 17999, comparePrice: 23999, stock: 15, rating: 4.7, sold: 96,
    colors: [C("Black", "#1f2937"), C("Brown", "#7c4a21")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: null,
    images: [U("photo-1551028719-00167b16eac5"), U("photo-1520975954732-35dd22299614")],
    shortDescription: "Classic biker silhouette in genuine leather.",
    description: "A timeless biker jacket cut from genuine leather with asymmetric zip, quilted shoulders and a tailored fit. Ages beautifully — the more you wear it, the better it looks.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Black" }, { type: "color", value: "Brown" }],
    bestSeller: false, isNewArrival: false,
    specifications: [{ label: "Material", value: "Genuine leather" }, { label: "Lining", value: "Polyester" }, { label: "Closure", value: "Asymmetric zip" }],
  },
  {
    name: "Summer Floral Dress", slug: "summer-floral-dress", category: "Fashion", subcategory: "Women's",
    brand: "Caprese", price: 9599, comparePrice: 11999, stock: 33, rating: 4.6, sold: 150,
    colors: [C("Floral Pink", "#f9a8d4"), C("Floral Blue", "#93c5fd")],
    sizes: ["XS", "S", "M", "L"], status: "in_stock", badge: "new",
    images: [U("photo-1595777457583-95e059d581b8"), U("photo-1572804013309-59a88b7e92f1")],
    shortDescription: "Light, breezy floral midi dress.",
    description: "A light and breezy floral midi dress with a flattering waist and flowing skirt. Made from breathable viscose — made for sunny days and summer evenings.",
    variants: [{ type: "size", value: "XS" }, { type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "color", value: "Floral Pink" }, { type: "color", value: "Floral Blue" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "100% Viscose" }, { label: "Length", value: "Midi" }, { label: "Care", value: "Hand wash" }],
  },
  // ---- New fashion (Hema-style shop) ----
  {
    name: "Oxford Cuban Shirt", slug: "oxford-cuban-shirt", category: "Fashion", subcategory: "Shirts",
    brand: "Bosh", price: 11760, priceTo: 11880, stock: 24, rating: 4.5, sold: 88,
    colors: [C("Black", "#1f2937"), C("Blue", "#3b82f6"), C("Grey", "#9ca3af"), C("Beige", "#d6c9b8"), C("Green", "#4ade80")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: "sale",
    images: [U("photo-1596755094514-f87e34085b2c"), U("photo-1602810318383-e386cc2a3ccf")],
    shortDescription: "Relaxed Cuban-collar shirt in breathable Oxford cotton.",
    description: "A relaxed-fit Cuban-collar shirt cut from breathable Oxford cotton. Camp collar, chest pocket and a clean drape — made for warm days and easy layering.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Black" }, { type: "color", value: "Blue" }, { type: "color", value: "Grey" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "100% Oxford cotton" }, { label: "Fit", value: "Relaxed" }, { label: "Care", value: "Machine wash cold" }],
  },
  {
    name: "Cuff Beanie Cap", slug: "cuff-beanie-cap", category: "Fashion", subcategory: "Accessories",
    brand: "HeySweet", price: 15360, priceTo: 15600, stock: 31, rating: 5.0, sold: 64,
    colors: [C("Blue", "#3b82f6"), C("Teal", "#14b8a6"), C("Grey", "#9ca3af"), C("Purple", "#a855f7")],
    sizes: ["S", "M", "L"], status: "in_stock", badge: null,
    images: [U("photo-1576871337622-98d48d1cf531"), U("photo-1575428652377-a2d80e2277fc")],
    shortDescription: "Chunky knit cuff beanie — warm, soft, one size fits most.",
    description: "A chunky knit beanie with a folded cuff and soft fleece lining. Keeps you warm without the itch — a cold-weather essential.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "color", value: "Blue" }, { type: "color", value: "Teal" }, { type: "color", value: "Grey" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "Acrylic knit, fleece lining" }, { label: "Fit", value: "One size fits most" }],
  },
  {
    name: "Flannel Collar Shirt", slug: "flannel-collar-shirt", category: "Fashion", subcategory: "Shirts",
    brand: "Red Duck", price: 7080, comparePrice: 8280, stock: 27, rating: 4.0, sold: 112,
    colors: [C("Blue", "#3b82f6"), C("Teal", "#14b8a6"), C("Grey", "#9ca3af")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: "sale", dealEndsAt: DAYS(6),
    images: [U("photo-1602810318383-e386cc2a3ccf"), U("photo-1596755094514-f87e34085b2c")],
    shortDescription: "Brushed flannel shirt with a classic collar.",
    description: "A soft brushed-flannel shirt with a classic button-down collar. Warm, breathable and easy to layer under jackets or over tees.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Blue" }, { type: "color", value: "Teal" }],
    isNewArrival: false,
    specifications: [{ label: "Material", value: "Brushed cotton flannel" }, { label: "Fit", value: "Regular" }],
  },
  {
    name: "Cotton Hooded Hoodie", slug: "cotton-hooded-hoodie", category: "Fashion", subcategory: "Hoodies",
    brand: "Campus", price: 11880, comparePrice: 23760, stock: 19, rating: 4.0, sold: 95,
    colors: [C("Blue", "#2563eb"), C("Black", "#1f2937"), C("Grey", "#9ca3af")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: "sale", dealEndsAt: DAYS(9),
    images: [U("photo-1578681994506-b8f463449011"), U("photo-1556821840-3a63f95609a7")],
    shortDescription: "Heavyweight cotton hoodie in bold royal blue.",
    description: "A heavyweight 400gsm cotton hoodie with a double-lined hood and kangaroo pocket. Bold colour, zero compromise on comfort.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Blue" }, { type: "color", value: "Black" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "400gsm cotton fleece" }, { label: "Fit", value: "Regular" }],
  },
  {
    name: "Foldable Duffel Bag", slug: "foldable-duffel-bag", category: "Fashion", subcategory: "Bag",
    brand: "Baggit", price: 2160, stock: 44, rating: 4.0, sold: 130,
    colors: [C("Pink", "#f9a8d4"), C("Beige", "#d6c9b8")],
    sizes: ["S", "M"], status: "in_stock", badge: null,
    images: [U("photo-1547949003-9792a18a2601"), U("photo-1590874103328-eac38a683ce7")],
    shortDescription: "Lightweight foldable duffel — packs flat, carries everything.",
    description: "A lightweight foldable duffel that packs into its own pocket. Perfect as a travel extra, gym bag or everyday carry-all.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "color", value: "Pink" }, { type: "color", value: "Beige" }],
    isNewArrival: false,
    specifications: [{ label: "Capacity", value: "25L" }, { label: "Material", value: "Ripstop nylon" }, { label: "Packs to", value: "Pocket size" }],
  },
  {
    name: "Hooded Neck Hoodies", slug: "hooded-neck-hoodies", category: "Fashion", subcategory: "Hoodies",
    brand: "Adidas", price: 4680, stock: 12, rating: 4.0, sold: 58,
    colors: [C("Blue", "#3b82f6"), C("Brown", "#7c4a21"), C("Green", "#4ade80"), C("Pink", "#f9a8d4")],
    sizes: ["S", "M", "L", "XL"], status: "pre_order", badge: null,
    images: [U("photo-1620799140408-edc6dcb6d633"), U("photo-1578681994506-b8f463449011")],
    shortDescription: "High-neck hoodie — pre-order now, ships next week.",
    description: "A cosy high-neck hoodie with a relaxed fit and soft brushed interior. This colourway is on pre-order and ships next week.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Blue" }, { type: "color", value: "Brown" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "Cotton-blend fleece" }, { label: "Fit", value: "Relaxed" }],
  },
  {
    name: "High-Waisted Pant", slug: "high-waisted-pant", category: "Fashion", subcategory: "Women's",
    brand: "Rise Bar", price: 2160, comparePrice: 2400, stock: 36, rating: 4.0, sold: 77,
    colors: [C("Black", "#1f2937"), C("Blue", "#3b82f6")],
    sizes: ["XS", "S", "M", "L"], status: "in_stock", badge: "sale",
    images: [U("photo-1594633312681-425c7b97ccd1"), U("photo-1503342217505-b0a15ec3261c")],
    shortDescription: "High-waisted straight-leg pant with a clean drape.",
    description: "A high-waisted straight-leg pant with a flattering fit and clean drape. Dress it up or down — it works everywhere.",
    variants: [{ type: "size", value: "XS" }, { type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "color", value: "Black" }, { type: "color", value: "Blue" }],
    isNewArrival: false,
    specifications: [{ label: "Material", value: "Cotton twill, stretch" }, { label: "Rise", value: "High" }],
  },
  {
    name: "Narrow Neck Tie", slug: "narrow-neck-tie", category: "Fashion", subcategory: "Accessories",
    brand: "D&G", price: 16080, stock: 0, rating: 4.0, sold: 41,
    colors: [C("Blue", "#3b82f6"), C("Grey", "#9ca3af")],
    sizes: ["S", "M"], status: "sold_out", badge: null,
    images: [U("photo-1598033129183-c4f50c736f10"), U("photo-1611312449408-fcece27cdbb7")],
    shortDescription: "Slim knitted tie in textured silk — currently sold out.",
    description: "A slim knitted tie in textured silk with a square tip. The finishing touch for sharp tailoring — back in stock soon.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "color", value: "Blue" }, { type: "color", value: "Grey" }],
    isNewArrival: false,
    specifications: [{ label: "Material", value: "Knitted silk" }, { label: "Width", value: "6 cm" }],
  },
  {
    name: "Men's Cheater Jacket", slug: "mens-cheater-jacket", category: "Fashion", subcategory: "Jackets",
    brand: "Nike", price: 11880, stock: 21, rating: 4.0, sold: 103,
    colors: [C("Orange", "#f97316"), C("Brown", "#7c4a21")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: "hot",
    images: [U("photo-1591047139829-d91aecb6caea"), U("photo-1551028719-00167b16eac5")],
    shortDescription: "Insulated puffer jacket — lightweight warmth for winter.",
    description: "A lightweight insulated puffer with a high collar and water-resistant shell. Serious warmth without the bulk.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Orange" }, { type: "color", value: "Brown" }],
    isNewArrival: true,
    specifications: [{ label: "Insulation", value: "Synthetic down" }, { label: "Shell", value: "Water-resistant nylon" }],
  },
  {
    name: "Casual Mustard Shirt", slug: "casual-mustard-shirt", category: "Fashion", subcategory: "Shirts",
    brand: "Bosh", price: 1326, stock: 48, rating: 4.0, sold: 69,
    colors: [C("Mustard", "#d9a441"), C("Blue", "#3b82f6"), C("Grey", "#9ca3af")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: null,
    images: [U("photo-1603252109303-2751441dd157"), U("photo-1596755094514-f87e34085b2c")],
    shortDescription: "Everyday mustard shirt — soft, breathable, easy to wear.",
    description: "An everyday shirt in warm mustard with a soft hand-feel and breathable weave. Pairs with anything, goes anywhere.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Mustard" }, { type: "color", value: "Blue" }],
    isNewArrival: false,
    specifications: [{ label: "Material", value: "Cotton poplin" }, { label: "Fit", value: "Regular" }],
  },
  {
    name: "Sleeve Round T-Shirt", slug: "sleeve-round-t-shirt", category: "Fashion", subcategory: "Tshirts",
    brand: "Campus", price: 2160, stock: 57, rating: 4.0, sold: 145,
    colors: [C("Green", "#4ade80"), C("Black", "#1f2937"), C("White", "#f8fafc")],
    sizes: ["XS", "S", "M", "L", "XL"], status: "in_stock", badge: null,
    images: [U("photo-1521572163474-6864f9cf17ab"), U("photo-1620799140408-edc6dcb6d633")],
    shortDescription: "Classic crew-neck tee in soft combed cotton.",
    description: "The perfect everyday tee — soft combed cotton, crew neckline, and a fit that stays true wash after wash.",
    variants: [{ type: "size", value: "XS" }, { type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Green" }, { type: "color", value: "Black" }, { type: "color", value: "White" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "100% combed cotton" }, { label: "Fit", value: "Regular" }],
  },
  {
    name: "Backpack Laptop Bag", slug: "backpack-laptop-bag", category: "Fashion", subcategory: "Bag",
    brand: "Baggit", price: 2160, comparePrice: 2400, stock: 33, rating: 4.0, sold: 91,
    colors: [C("Black", "#1f2937"), C("Grey", "#9ca3af")],
    sizes: ["S", "M"], status: "in_stock", badge: "sale", dealEndsAt: DAYS(4),
    images: [U("photo-1491637639811-60e2756cc1c7"), U("photo-1553062407-98eeb64c6a62")],
    shortDescription: "Slim laptop backpack with padded 15\" sleeve.",
    description: "A slim, lightweight backpack with a padded 15-inch laptop sleeve, front organiser pocket and water-resistant fabric.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "color", value: "Black" }, { type: "color", value: "Grey" }],
    isNewArrival: false,
    specifications: [{ label: "Capacity", value: "18L" }, { label: "Fits", value: "Up to 15\" laptop" }, { label: "Material", value: "Water-resistant polyester" }],
  },
  {
    name: "Women's Knit Sweater", slug: "womens-knit-sweater", category: "Fashion", subcategory: "Women's",
    brand: "Caprese", price: 5999, comparePrice: 7799, stock: 26, rating: 4.7, sold: 83,
    colors: [C("Beige", "#d6c9b8"), C("Pink", "#f9a8d4"), C("Grey", "#9ca3af")],
    sizes: ["XS", "S", "M", "L"], status: "in_stock", badge: "sale",
    images: [U("photo-1571945153237-4929e783af4a"), U("photo-1595777457583-95e059d581b8")],
    shortDescription: "Soft chunky-knit sweater with a relaxed drape.",
    description: "A soft chunky-knit sweater with a relaxed drape and ribbed trims. Cosy, breathable and made to layer all season.",
    variants: [{ type: "size", value: "XS" }, { type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "color", value: "Beige" }, { type: "color", value: "Pink" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "Acrylic-wool blend" }, { label: "Fit", value: "Relaxed" }],
  },
  {
    name: "Ribbed Knit Top", slug: "ribbed-knit-top", category: "Fashion", subcategory: "Top",
    brand: "HeySweet", price: 3599, stock: 39, rating: 4.5, sold: 72,
    colors: [C("Yellow", "#facc15"), C("White", "#f8fafc"), C("Black", "#1f2937")],
    sizes: ["XS", "S", "M", "L"], status: "in_stock", badge: null,
    images: [U("photo-1503342217505-b0a15ec3261c"), U("photo-1594633312681-425c7b97ccd1")],
    shortDescription: "Stretch ribbed knit top — soft, fitted, endlessly versatile.",
    description: "A stretch ribbed-knit top with a flattering fitted cut. Layer it under jackets or wear it solo — it goes with everything.",
    variants: [{ type: "size", value: "XS" }, { type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "color", value: "Yellow" }, { type: "color", value: "White" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "Ribbed knit, stretch" }, { label: "Fit", value: "Fitted" }],
  },
  {
    name: "Classic Denim Jacket", slug: "classic-denim-jacket", category: "Fashion", subcategory: "Jackets",
    brand: "Adidas", price: 10799, comparePrice: 14399, stock: 17, rating: 4.6, sold: 66,
    colors: [C("Blue", "#3b82f6"), C("Black", "#1f2937")],
    sizes: ["S", "M", "L", "XL"], status: "in_stock", badge: "sale",
    images: [U("photo-1611312449408-fcece27cdbb7"), U("photo-1591047139829-d91aecb6caea")],
    shortDescription: "Timeless trucker denim jacket in washed indigo.",
    description: "The timeless trucker jacket — washed indigo denim, button front, chest pockets. A layer that never goes out of style.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "size", value: "L" }, { type: "size", value: "XL" }, { type: "color", value: "Blue" }, { type: "color", value: "Black" }],
    isNewArrival: false,
    specifications: [{ label: "Material", value: "100% cotton denim" }, { label: "Fit", value: "Regular" }],
  },
  {
    name: "Striped Tote Bag", slug: "striped-tote-bag", category: "Fashion", subcategory: "Bag",
    brand: "Caprese", price: 4199, stock: 29, rating: 4.6, sold: 54,
    colors: [C("Beige", "#d6c9b8"), C("Brown", "#7c4a21")],
    sizes: ["S", "M"], status: "in_stock", badge: null,
    images: [U("photo-1590874103328-eac38a683ce7"), U("photo-1547949003-9792a18a2601")],
    shortDescription: "Striped canvas tote — roomy, sturdy, everyday ready.",
    description: "A roomy striped canvas tote with leather handles and an interior zip pocket. Your everyday carry, sorted.",
    variants: [{ type: "size", value: "S" }, { type: "size", value: "M" }, { type: "color", value: "Beige" }, { type: "color", value: "Brown" }],
    isNewArrival: true,
    specifications: [{ label: "Material", value: "Canvas + leather handles" }, { label: "Capacity", value: "20L" }],
  },
  // ---- Electronics ----
  {
    name: "Wireless Headphone", slug: "wireless-headphone", category: "Electronics",
    price: 4799, comparePrice: 7199, stock: 60, rating: 4.5, sold: 520,
    images: [U("photo-1505740420928-5e560c06d30e"), U("photo-1583394838336-acd977736f90")],
    shortDescription: "Rich sound, all-day comfort, 40h battery.",
    description: "Wireless over-ear headphones with deep bass, crystal-clear calls and up to 40 hours of playtime. Foldable design with soft memory-foam ear cushions.",
    variants: [{ type: "color", value: "Black" }, { type: "color", value: "White" }],
    featured: true, bestSeller: true, isNewArrival: true,
    specifications: [{ label: "Battery", value: "40 hours" }, { label: "Bluetooth", value: "5.3" }, { label: "Driver", value: "40mm" }],
  },
  {
    name: "Smart Watch Series 9", slug: "smart-watch-series-9", category: "Electronics",
    price: 23999, comparePrice: 29999, stock: 22, rating: 4.8, sold: 260,
    images: [U("photo-1523275335684-37898b6baf30"), U("photo-1546868871-7041f2a55e12")],
    shortDescription: "Your health, fitness and notifications on your wrist.",
    description: "Track workouts, heart rate and sleep, take calls and get notifications right on your wrist. Bright always-on display with up to 18 hours of battery.",
    variants: [{ type: "color", value: "Black" }, { type: "color", value: "Silver" }],
    bestSeller: true, isNewArrival: true,
    specifications: [{ label: "Display", value: "AMOLED always-on" }, { label: "Battery", value: "18 hours" }, { label: "Water resistance", value: "5 ATM" }],
  },
  {
    name: "Bluetooth Speaker", slug: "bluetooth-speaker", category: "Electronics",
    price: 5999, comparePrice: 8399, stock: 38, rating: 4.4, sold: 180,
    images: [U("photo-1608043152269-423dbba4e7e1"), U("photo-1589003077984-894e133dabab")],
    shortDescription: "Room-filling sound in a portable package.",
    description: "A compact portable speaker with surprisingly big sound, 24-hour battery and splash resistance. Pair two for true stereo sound.",
    variants: [{ type: "color", value: "Black" }, { type: "color", value: "Blue" }],
    isNewArrival: false,
    specifications: [{ label: "Battery", value: "24 hours" }, { label: "Output", value: "20W" }, { label: "Rating", value: "IPX5 splash-proof" }],
  },
  {
    name: "DSLR Camera", slug: "dslr-camera", category: "Electronics",
    price: 65999, comparePrice: 77999, stock: 9, rating: 4.9, sold: 74,
    images: [U("photo-1516035069371-29a1b244cc32"), U("photo-1512790182412-b19e6d62bc39")],
    shortDescription: "Capture life in stunning detail.",
    description: "A versatile DSLR with a 24MP sensor, fast autofocus and Full HD video. Comes with an 18-55mm kit lens — everything a beginner or enthusiast needs.",
    variants: [{ type: "color", value: "Black" }],
    isNewArrival: false,
    specifications: [{ label: "Sensor", value: "24.2MP APS-C" }, { label: "Video", value: "Full HD 1080p" }, { label: "Lens", value: "18-55mm kit" }],
  },
  // ---- Beauty ----
  {
    name: "Matte Lipstick Set", slug: "matte-lipstick-set", category: "Beauty",
    price: 3599, comparePrice: 4799, stock: 55, rating: 4.6, sold: 210,
    images: [U("photo-1586495777744-4413f21062fa"), U("photo-1522335789203-aabd1fc54bc9")],
    shortDescription: "Six rich matte shades in one set.",
    description: "Six velvety matte lipsticks in universally flattering shades — from everyday nude to bold red. Long-wearing, non-drying formula enriched with vitamin E.",
    variants: [{ type: "color", value: "Nude Set" }, { type: "color", value: "Bold Set" }],
    isNewArrival: true,
    specifications: [{ label: "Finish", value: "Matte" }, { label: "Count", value: "6 shades" }, { label: "Wear", value: "Up to 8 hours" }],
  },
  {
    name: "Perfume Essence", slug: "perfume-essence", category: "Beauty",
    price: 10799, comparePrice: 14399, stock: 26, rating: 4.8, sold: 165,
    images: [U("photo-1541643600914-78b084683601"), U("photo-1594035910387-fea47794261f")],
    shortDescription: "A signature scent — floral, warm, unforgettable.",
    description: "An elegant eau de parfum blending bergamot, jasmine and warm amber. Long-lasting and sophisticated — your new signature scent.",
    variants: [{ type: "size", value: "50ml" }, { type: "size", value: "100ml" }],
    bestSeller: true, isNewArrival: false,
    specifications: [{ label: "Type", value: "Eau de Parfum" }, { label: "Notes", value: "Bergamot, Jasmine, Amber" }, { label: "Size", value: "50ml / 100ml" }],
  },
  {
    name: "Vitamin C Serum", slug: "vitamin-c-serum", category: "Beauty",
    price: 4199, comparePrice: 5399, stock: 48, rating: 4.7, sold: 290,
    images: [U("photo-1620916566398-39f1143ab7be"), U("photo-1571781926291-c477ebfd024b")],
    shortDescription: "Brightening serum for a healthy glow.",
    description: "A 15% vitamin C serum that brightens dull skin, fades dark spots and boosts collagen. Lightweight, fast-absorbing and gentle enough for daily use.",
    variants: [{ type: "size", value: "30ml" }],
    isNewArrival: true,
    specifications: [{ label: "Active", value: "15% Vitamin C" }, { label: "Skin type", value: "All types" }, { label: "Size", value: "30ml" }],
  },
  {
    name: "Hydrating Face Cream", slug: "hydrating-face-cream", category: "Beauty",
    price: 3359, comparePrice: 4199, stock: 64, rating: 4.5, sold: 240,
    images: [U("photo-1556228720-195a672e8a03"), U("photo-1570172619644-dfd03ed5d881")],
    shortDescription: "48-hour hydration for soft, plump skin.",
    description: "A rich yet non-greasy face cream with hyaluronic acid and ceramides. Locks in moisture for 48 hours and strengthens the skin barrier.",
    variants: [{ type: "size", value: "50ml" }],
    isNewArrival: false,
    specifications: [{ label: "Key ingredients", value: "Hyaluronic acid, Ceramides" }, { label: "Skin type", value: "Dry / Normal" }, { label: "Size", value: "50ml" }],
  },
  // ---- Fitness ----
  {
    name: "Yoga Mat Pro", slug: "yoga-mat-pro", category: "Fitness",
    price: 4799, comparePrice: 5999, stock: 45, rating: 4.7, sold: 190,
    images: [U("photo-1506126613408-eca07ce68773"), U("photo-1544367567-0f2fcb009e0b")],
    shortDescription: "Non-slip 6mm mat with carry strap.",
    description: "A 6mm thick non-slip yoga mat with excellent grip and joint-friendly cushioning. Includes a carry strap and is easy to wipe clean.",
    variants: [{ type: "color", value: "Purple" }, { type: "color", value: "Teal" }, { type: "color", value: "Grey" }],
    isNewArrival: true,
    specifications: [{ label: "Thickness", value: "6mm" }, { label: "Material", value: "TPE, non-slip" }, { label: "Size", value: "183 × 66 cm" }],
  },
  {
    name: "Adjustable Dumbbell Set", slug: "adjustable-dumbbell-set", category: "Fitness",
    price: 15599, comparePrice: 20399, stock: 18, rating: 4.8, sold: 88,
    images: [U("photo-1638536532686-d610adfc8e5c"), U("photo-1571019613454-1cb2f99b2d8b")],
    shortDescription: "Two dumbbells, 5–25kg each, one dial.",
    description: "Replace a whole rack with one pair: each dumbbell adjusts from 5 to 25kg with a quick dial turn. Compact, sturdy and perfect for home gyms.",
    variants: [{ type: "color", value: "Black / Red" }],
    bestSeller: true, isNewArrival: false,
    specifications: [{ label: "Weight range", value: "5–25 kg each" }, { label: "Adjustment", value: "Dial" }, { label: "Set", value: "Pair" }],
  },
  {
    name: "Resistance Bands Set", slug: "resistance-bands-set", category: "Fitness",
    price: 2399, comparePrice: 3599, stock: 80, rating: 4.4, sold: 310,
    images: [U("photo-1598289431512-b97b0917affc"), U("photo-1518611012118-696072aa579a")],
    shortDescription: "Five bands from light to extra-heavy.",
    description: "Five stackable resistance bands (10–50 lbs) with handles, ankle straps and a door anchor. Train anywhere — home, park or travel.",
    variants: [{ type: "color", value: "Multi" }],
    isNewArrival: false,
    specifications: [{ label: "Resistance", value: "10–50 lbs" }, { label: "Count", value: "5 bands" }, { label: "Includes", value: "Handles, ankle straps, door anchor" }],
  },
  {
    name: "Gym Duffel Bag", slug: "gym-duffel-bag", category: "Fitness",
    price: 5399, comparePrice: 7199, stock: 31, rating: 4.6, sold: 120,
    images: [U("photo-1553062407-98eeb64c6a62"), U("photo-1547949003-9792a18a2601")],
    shortDescription: "40L duffel with shoe pocket and wet pouch.",
    description: "A 40L gym duffel with a ventilated shoe compartment, wet pouch, water-bottle holder and padded shoulder strap. Water-resistant and built to last.",
    variants: [{ type: "color", value: "Black" }, { type: "color", value: "Navy" }],
    isNewArrival: true,
    specifications: [{ label: "Capacity", value: "40L" }, { label: "Material", value: "Water-resistant polyester" }, { label: "Pockets", value: "Shoe + wet pouch" }],
  },
  // ---- Home Decor ----
  {
    name: "Modern Sofa", slug: "modern-sofa", category: "Home Decor",
    price: 59999, comparePrice: 83999, stock: 7, rating: 4.8, sold: 42,
    images: [U("photo-1555041469-a586c61ea9bc"), U("photo-1493663284031-b7e3aefcae8e")],
    shortDescription: "Three-seater comfort in washable fabric.",
    description: "A modern three-seater sofa with deep cushions, solid wood legs and stain-resistant washable fabric. Seats three in cloud-like comfort.",
    variants: [{ type: "color", value: "Grey" }, { type: "color", value: "Beige" }],
    bestSeller: true, isNewArrival: false,
    specifications: [{ label: "Seats", value: "3" }, { label: "Fabric", value: "Washable, stain-resistant" }, { label: "Frame", value: "Solid wood" }],
  },
  {
    name: "Ceramic Table Lamp", slug: "ceramic-table-lamp", category: "Home Decor",
    price: 6599, comparePrice: 8399, stock: 24, rating: 4.5, sold: 76,
    images: [U("photo-1507473885765-e6ed057f782c"), U("photo-1513506003901-1e6a229e2d15")],
    shortDescription: "Warm light, handcrafted ceramic base.",
    description: "A handcrafted ceramic table lamp with a linen shade that casts a warm, cosy glow. Perfect for bedside tables and reading corners.",
    variants: [{ type: "color", value: "White" }, { type: "color", value: "Terracotta" }],
    isNewArrival: true,
    specifications: [{ label: "Height", value: "45 cm" }, { label: "Bulb", value: "E27, max 40W (not included)" }, { label: "Material", value: "Ceramic + linen" }],
  },
  {
    name: "Wall Art Canvas", slug: "wall-art-canvas", category: "Home Decor",
    price: 4799, comparePrice: 6599, stock: 36, rating: 4.6, sold: 110,
    images: [U("photo-1513519245088-0e12902e5a38"), U("photo-1519710164239-da123dc03ef4")],
    shortDescription: "Abstract canvas print, ready to hang.",
    description: "A gallery-quality abstract canvas print on a wooden frame, ready to hang. Adds instant warmth and character to any room.",
    variants: [{ type: "size", value: "60×90 cm" }, { type: "size", value: "40×60 cm" }],
    isNewArrival: false,
    specifications: [{ label: "Material", value: "Canvas on pine frame" }, { label: "Hanging", value: "Ready to hang" }],
  },
  {
    name: "Indoor Plant Pot", slug: "indoor-plant-pot", category: "Home Decor",
    price: 2999, comparePrice: 3959, stock: 52, rating: 4.4, sold: 140,
    images: [U("photo-1485955900006-10f4d324d411"), U("photo-1416879595882-3373a0480b5b")],
    shortDescription: "Minimal ceramic pot with drainage.",
    description: "A minimal ceramic plant pot with drainage hole and matching saucer. The perfect home for your favourite indoor plant.",
    variants: [{ type: "color", value: "White" }, { type: "color", value: "Sage" }],
    isNewArrival: false,
    specifications: [{ label: "Diameter", value: "18 cm" }, { label: "Material", value: "Ceramic" }, { label: "Drainage", value: "Yes, with saucer" }],
  },
  // ---- Accessories ----
  {
    name: "Aviator Sunglasses", slug: "aviator-sunglasses", category: "Accessories",
    price: 10799, comparePrice: 14399, stock: 29, rating: 4.7, sold: 175,
    images: [U("photo-1572635196237-14b3f281503f"), U("photo-1511499767150-a48a237f0083")],
    shortDescription: "Classic aviators with UV400 protection.",
    description: "Timeless aviator sunglasses with polarised lenses and full UV400 protection. Lightweight metal frame with adjustable nose pads.",
    variants: [{ type: "color", value: "Gold / Green" }, { type: "color", value: "Silver / Grey" }],
    featured: true, bestSeller: true, isNewArrival: true,
    specifications: [{ label: "Lens", value: "Polarised, UV400" }, { label: "Frame", value: "Metal" }, { label: "Includes", value: "Hard case + cloth" }],
  },
  {
    name: "Leather Handbag", slug: "leather-handbag", category: "Accessories",
    price: 14399, comparePrice: 17999, stock: 19, rating: 4.8, sold: 132,
    images: [U("photo-1584917865442-de89df76afd3"), U("photo-1548036328-c9fa89d128fa")],
    shortDescription: "Genuine leather tote with laptop sleeve.",
    description: "A structured genuine-leather tote with a padded laptop sleeve, interior zip pocket and magnetic closure. Carries your day in style.",
    variants: [{ type: "color", value: "Tan" }, { type: "color", value: "Black" }],
    bestSeller: true, isNewArrival: false,
    specifications: [{ label: "Material", value: "Genuine leather" }, { label: "Fits", value: "Up to 14\" laptop" }, { label: "Closure", value: "Magnetic" }],
  },
  {
    name: "Stainless Steel Bottle", slug: "stainless-steel-bottle", category: "Accessories",
    price: 2999, comparePrice: 3959, stock: 70, rating: 4.6, sold: 280,
    images: [U("photo-1602143407151-7111542de6e8"), U("photo-1523362628745-0c100150b504")],
    shortDescription: "Keeps drinks cold 24h / hot 12h.",
    description: "Double-wall vacuum-insulated stainless steel bottle. Keeps drinks cold for 24 hours or hot for 12. Leak-proof and sweat-free.",
    variants: [{ type: "color", value: "Matte Black" }, { type: "color", value: "Ocean Blue" }, { type: "color", value: "Rose" }],
    isNewArrival: true,
    specifications: [{ label: "Capacity", value: "750 ml" }, { label: "Insulation", value: "Double-wall vacuum" }, { label: "Material", value: "18/8 stainless steel" }],
  },
  {
    name: "Minimalist Watch", slug: "minimalist-watch", category: "Accessories",
    price: 17999, comparePrice: 22799, stock: 16, rating: 4.9, sold: 98,
    images: [U("photo-1524592094714-0f0654e20314"), U("photo-1523170335258-f5ed11844a49")],
    shortDescription: "Clean design, Italian leather strap.",
    description: "A clean, minimal watch with a sapphire-coated face and genuine Italian leather strap. Understated elegance for every day.",
    variants: [{ type: "color", value: "Brown Leather" }, { type: "color", value: "Black Leather" }],
    isNewArrival: false,
    specifications: [{ label: "Case", value: "40mm, sapphire-coated" }, { label: "Strap", value: "Italian leather" }, { label: "Water resistance", value: "5 ATM" }],
  },
];

const REVIEW_POOL = [
  { userName: "Ayesha K.", rating: 5, title: "Absolutely love it!", comment: "Quality is way better than expected for the price. Shipping was fast too." },
  { userName: "Rahim U.", rating: 5, title: "Great purchase", comment: "Exactly as described. Would definitely buy again." },
  { userName: "Tanvir H.", rating: 4, title: "Very good", comment: "Really happy with it overall — just wish there were more colour options." },
  { userName: "Maya S.", rating: 5, title: "Highly recommended", comment: "Bought one for myself and one as a gift. Both perfect." },
  { userName: "Sakib R.", rating: 4, title: "Good value", comment: "Solid product, does what it says. Delivery took a day longer than expected." },
];

const CUSTOMERS = [
  { name: "Demo Customer", email: "demo@aatrend.com", password: "demo1234" },
  { name: "Ayesha Khan", email: "ayesha@example.com", password: "customer123" },
  { name: "Rahim Uddin", email: "rahim@example.com", password: "customer123" },
];

async function main() {
  const mongoose = (await import("mongoose")).default;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "novatrend", bufferCommands: false });
  console.log("connected to aatrend db");

  const productSchema = new mongoose.Schema({}, { strict: false, collection: "products" });
  const Product = mongoose.models.Product ?? mongoose.model("Product", productSchema);
  const orderSchema = new mongoose.Schema({}, { strict: false, collection: "orders" });
  const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
  const userSchema = new mongoose.Schema({}, { strict: false, collection: "users" });
  const User = mongoose.models.User ?? mongoose.model("User", userSchema);
  const couponSchema = new mongoose.Schema({}, { strict: false, collection: "coupons" });
  const Coupon = mongoose.models.Coupon ?? mongoose.model("Coupon", couponSchema);

  let created = 0, updated = 0;
  for (const p of PRODUCTS) {
    const reviews = [REVIEW_POOL[0], REVIEW_POOL[1], REVIEW_POOL[2]].map((r, i) => ({
      ...r,
      rating: Math.min(5, Math.max(4, p.rating + (i === 2 ? -1 : 0))),
      createdAt: new Date(Date.now() - (i + 2) * 86400000),
    }));
    const doc = {
      ...p,
      onSale: !!p.comparePrice && p.comparePrice > p.price,
      reviews,
      reviewCount: reviews.length,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000),
    };
    const res = await Product.updateOne({ slug: p.slug }, { $set: doc }, { upsert: true });
    if (res.upsertedCount) created++;
    else updated++;
  }
  console.log(`products: ${created} created, ${updated} updated`);

  await Coupon.updateOne(
    { code: "WELCOME10" },
    {
      $set: { code: "WELCOME10", type: "percent", value: 10, percent: 10, minOrder: 0, active: true },
      $setOnInsert: { usedCount: 0 },
    },
    { upsert: true }
  );
  console.log("coupon WELCOME10 (10% off) ready");

  for (const c of CUSTOMERS) {
    const hash = await bcrypt.hash(c.password, 10);
    // Stagger joined dates so re-seeded demo customers show a real date.
    const joinedAt = new Date(Date.now() - (CUSTOMERS.indexOf(c) + 3) * 86400000);
    await User.updateOne(
      { email: c.email },
      {
        $setOnInsert: {
          name: c.name,
          email: c.email,
          passwordHash: hash,
          role: "customer",
          createdAt: joinedAt,
          updatedAt: joinedAt,
        },
      },
      { upsert: true }
    );
  }
  console.log("demo customers ready (see README for login details)");

  const orderCount = await Order.countDocuments();
  if (orderCount === 0) {
    const all = await Product.find({}).lean();
    const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));
    const buyers = [
      { name: "Ayesha Khan", email: "ayesha@example.com" },
      { name: "Rahim Uddin", email: "rahim@example.com" },
      { name: "Demo Customer", email: "demo@aatrend.com" },
    ];
    const picks = [
      ["essential-hoodie", "air-max-270-sneakers"],
      ["wireless-headphone"],
      ["smart-watch-series-9", "aviator-sunglasses"],
      ["leather-handbag"],
      ["vitamin-c-serum", "matte-lipstick-set"],
      ["modern-sofa"],
      ["adjustable-dumbbell-set", "yoga-mat-pro"],
      ["perfume-essence"],
      ["bluetooth-speaker", "dslr-camera"],
      ["stainless-steel-bottle", "resistance-bands-set"],
    ];
    const statuses = ["Delivered", "Delivered", "Shipped", "Processing", "Delivered", "Pending", "Delivered", "Shipped", "Delivered", "Processing"];
    const orders = picks.map((slugs, i) => {
      const items = slugs.map((s) => {
        const p = bySlug[s];
        return { productId: String(p._id), name: p.name, image: p.images[0], price: p.price, quantity: 1 + (i % 2), variant: "" };
      });
      const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
      const discount = i === 0 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const shipping = subtotal - discount >= 50 ? 0 : 4.99;
      const buyer = buyers[i % buyers.length];
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return {
        orderNumber: `NT-SEED${1000 + i}`,
        customerName: buyer.name,
        customerEmail: buyer.email,
        items,
        subtotal,
        discount,
        shipping,
        total: Math.round((subtotal - discount + shipping) * 100) / 100,
        couponCode: discount ? "WELCOME10" : undefined,
        paymentMethod: i % 2 === 0 ? "COD" : "Card",
        status: statuses[i],
        shippingAddress: { address: "12 Green Road", city: "Dhaka", zip: "1205", country: "Bangladesh", phone: "+8801700000000" },
        createdAt: d,
        updatedAt: d,
      };
    });
    await Order.insertMany(orders);
    console.log(`orders: ${orders.length} seeded over the last 14 days`);
  } else {
    console.log(`orders: ${orderCount} already present, skipping order seed`);
  }

  await mongoose.disconnect();
  console.log("seed done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
