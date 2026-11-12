# aatrend — Premium Ecommerce Store

A complete ecommerce website built from scratch with **Next.js 16 (App Router,
TypeScript, Tailwind CSS v4)** and **MongoDB (Mongoose)**. Storefront inspired by
modern premium stores (hero, categories, new arrivals, best sellers, flash sale)
plus an admin marketing dashboard with charts. No proprietary code is used —
the layout and implementation are original.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Configuration

All settings live in **`.env.local`** (already created for this project):

- `MONGODB_URI` — MongoDB Atlas connection string (see "Switch database" below)
- `AUTH_SECRET` — NextAuth secret
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — admin login
- `NEXT_PUBLIC_SITE_URL` — public site URL
- `NEXTAUTH_URL` — auth callback base URL (same as site URL in production)

`.env.local` is git-ignored. Never commit it.

## Admin panel

- URL: **http://localhost:3000/admin**
- Sign in with the admin email/password from `.env.local`
  (`ADMIN_EMAIL=admin@novatrend.com` — password is in `.env.local`).
- **Dashboard**: revenue, orders, products, conversion stat cards; 14-day
  revenue chart; traffic channels donut; top products; recent orders.
- **Products**: full CRUD (name, price, compare price, category, images, stock,
  size/color variants, featured / best-seller / new / sale flags, specs) with
  search + pagination (10/page).
- **Orders**: list with status filter and status update
  (Pending → Processing → Shipped → Delivered / Cancelled).
- **Customers**: registered customers with order count and total spent.
- **Flash Sale** (`/admin/flash-sale`): turn the home-page flash-sale banner on/off,
  edit its headline, set the end date + time (live countdown ticks to it; the
  banner hides itself after the sale ends), button text + link.
- **Hero Slides** (`/admin/hero-slides`): up to 5 home-page hero slides — change
  each slide's image URL, title, subtitle and button; add, remove, reorder.
  The slider auto-advances every 3 seconds (pauses on hover, swipe works).
- **Coupons** (`/admin/coupons`): create/edit/delete coupon codes — percent or
  fixed-amount discount, minimum order, expiry date, usage limit, active toggle.
  Usage counts update automatically when orders are placed. Seeded codes:
  `WELCOME10` (10% off) and `FLASH20` (20% off, 30 days).

## Storefront features

- Header: announcement bar, live search with suggestions, wishlist + cart
  counters, account menu.
- Home: hero, trust badges, Shop by Categories (6), New Arrivals carousel,
  Best Sellers grid, Flash Sale countdown, promo banners.
- Shop (Hema-style): category tiles with images + counts; sidebar filters —
  categories with counts, price range slider, availability (In Stock / On
  Sale), color swatches, sizes, brands with counts, star ratings; toolbar
  with grid 2/3/4 + list view, "Showing 1–12 of N results", sort (Latest,
  price, rating, popular); product badges Sale / Hot / Pre Order / Sold Out
  and live deal countdown timers; numbered pagination.
- Product detail (Hema-style): breadcrumb, vertical thumbnail gallery with
  zoom, discount badge, star rating + Write a Review, Availability / SKU /
  Categories / Tags / Brand, price range (e.g. $98.00 – $99.00, updates with
  size), "sold in last 5 hours", color swatches, size buttons + Clear,
  quantity stepper, ADD TO CART + BUY IT NOW, Wishlist / Compare / Delivery
  & Returns / Enquiry / Share, "People are Looking", estimated delivery,
  payment badges; tabs — DESCRIPTION (features + side image), ADDITIONAL
  INFORMATION, REVIEWS, SHIPPING & RETURN; "You may also like" carousel +
  Related products grid; /compare page compares up to 4 products.
- Products carry brand, sub-category, colors (with hex), sizes, status
  (in_stock / pre_order / sold_out), badge, dealEndsAt and priceTo — all
  editable in the admin product form.
- Cart: drawer + cart page, quantity editing, free-shipping progress bar
  (free over $50), coupon support — try `WELCOME10` for 10% off.
- Checkout: shipping form, Cash on Delivery + Card (**demo** — no real payment
  gateway, no charge is ever made), order success page with order number.
- Accounts: register / login, order history, wishlist page.
- Purchase popup (social proof): a small card slides in at the bottom-right
  of the storefront (above the mobile bottom nav on phones) showing a real
  recent purchase — buyer first name + area, product photo + name, and how
  long ago. First popup ~15s after page load, then every few minutes, each
  showing ~8s. Only real orders from the last 30 days are ever shown
  (cancelled orders skipped); with no recent orders the popup stays hidden.
  Manage it at Admin → 🔔 Purchase Popups (on/off + interval, 1–60 minutes,
  default 5). Settings live in `SiteSettings.purchasePopup`; the public feed
  is `GET /api/purchase-popup` (sanitized: first name, area, product name,
  photo, order time — no phone, email, address, or amounts).

## Switch database

The app reads `MONGODB_URI` from **one place only: `.env.local`**.
The store is currently pointed at the new Atlas cluster (database
`novatrend`) — that URI is already in `.env.local`.
To point the store at a different MongoDB database later:

1. Open `.env.local` and replace the `MONGODB_URI=...` line with the new
   connection string (keep the same format; the database name in the URI is
   used as-is).
2. **Important — Atlas Network Access:** the new cluster must allow your
   IP. In Atlas → Network Access → Add IP Address, allow `0.0.0.0/0`
   (needed for Vercel, whose IPs change) or add your own IP. Without this,
   connections fail with an IP-whitelist error.
3. Re-run the seed so the new database gets the catalogue:
   ```bash
   node scripts/seed.mjs
   ```
   The seed is re-runnable (products/coupons/users upsert by slug/code/email;
   orders seed only when the orders collection is empty).
4. Restart the dev server (`npm run dev`).

## Seeding

```bash
node scripts/seed.mjs
```

Seeds 24 products across 6 categories (Fashion, Electronics, Beauty, Fitness,
Home Decor, Accessories), coupon `WELCOME10` (10% off), 3 demo customers and
10 orders spread over the last 14 days (so the dashboard charts are alive).

Demo customer login: `demo@aatrend.com` / `demo1234`.

## API routes

- `GET /api/products?q=&category=&min=&max=&rating=&inStock=&sort=&page=` — list
- `GET /api/products/[slug]` — detail · `POST /api/products/[slug]/reviews` — auth
- `GET /api/search?q=` — live search suggestions
- `POST /api/coupons/validate` — `{ code }`
- `POST /api/orders` — create order · `GET /api/orders` — my orders (auth)
- `POST /api/auth/register` — customer registration
- `GET /api/admin/stats` — dashboard stats (admin)
- `GET/POST /api/admin/products` · `GET/PUT/DELETE /api/admin/products/[id]` (admin)
- `GET /api/admin/orders` · `PATCH /api/admin/orders/[id]` (admin)
- `GET /api/admin/customers` (admin)
- `GET/PUT /api/admin/settings` — flash sale + hero slides (admin)
- `GET/POST /api/admin/coupons` · `PUT/DELETE /api/admin/coupons/[id]` (admin)

## Project structure

```
src/
  app/            pages: home, /shop, /product/[slug], /category/[slug],
                  /cart, /checkout, /order-success, /account, /orders,
                  /wishlist, /login, /register, /about, /blog, /contact,
                  /admin/* (login + dashboard, products, orders, customers)
  app/api/        public + admin API routes, NextAuth handler
  components/     Header, ProductCard, CartDrawer, CarouselRow, FlashSale,
                  ProductDetailClient, ReviewForm, AuthForm, AdminCharts,
                  AdminLoginForm, ProductForm, SignOutButton, Providers
  lib/            db (Mongoose), auth (NextAuth), store (cart/wishlist), utils
  models/         Product, Order, User, Coupon
scripts/seed.mjs  catalogue + coupon + customers + orders seeder
```

## Notes

- **Demo checkout:** card payment is a labelled demo — no payment gateway is
  connected and no real charge is ever made.
- **Sandbox-only tunnel:** `scripts/mongo-tunnel.mjs` + the `MONGO_TUNNEL=1` DNS
  patch in `src/instrumentation.ts` exist only so this sandboxed VM can reach
  Atlas through its egress proxy. They do nothing unless `MONGO_TUNNEL=1` is
  set — on your PC or Vercel, run normally without them.
#   a a t r e n d  
 