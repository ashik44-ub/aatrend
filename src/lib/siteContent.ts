/** Default store texts, used when the admin has not saved their own yet. */

export const DEFAULT_TRUST_BADGES = [
  { icon: "🚚", title: "Free Shipping", sub: "On selected products" },
  { icon: "🔒", title: "Secure Payments", sub: "100% secure checkout" },
  { icon: "↩️", title: "Easy Returns", sub: "30-day return policy" },
  { icon: "🎧", title: "24/7 Support", sub: "Always here to help" },
];

export const DEFAULT_PROMO_TILES = [
  {
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
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

export const DEFAULT_HEADINGS = {
  categoriesTitle: "Shop by Categories",
  newArrivalsTitle: "New Arrivals",
  bestSellersTitle: "Best Sellers",
};

export const DEFAULT_FOOTER = {
  aboutText:
    "Shop the latest trending products curated for modern lifestyles. Loved by 50,000+ customers worldwide.",
  copyrightText: "",
};
