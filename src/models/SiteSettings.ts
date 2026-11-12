import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IHeroSlide {
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  order: number;
}

export interface IFlashSale {
  active: boolean;
  title: string;
  subtitle: string;
  discountText: string;
  endsAt?: Date;
  buttonText: string;
  buttonLink: string;
}

export interface ISummerSale {
  active: boolean;
  title: string;
  subtitle: string;
  discountText: string;
  endsAt?: Date;
  buttonText: string;
  buttonLink: string;
  bannerImage: string;
  themeColor: string;
  /** Product slugs hand-picked for the sale (empty = use categories). */
  productIds: string[];
  /** Whole categories/subcategories in the sale (used when productIds is empty). */
  categories: string[];
}

export interface ITrustBadge {
  icon: string;
  title: string;
  sub: string;
}

export interface IPromoTile {
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  bg: string;
  active: boolean;
  order: number;
}

export interface IShipping {
  /** Delivery charge inside Dhaka (Taka). */
  insideDhaka: number;
  /** Delivery charge outside Dhaka (Taka). */
  outsideDhaka: number;
}

export interface IFreeShipping {
  active: boolean;
  /** Optional end date/time — empty means the campaign runs until switched off. */
  endsAt?: Date;
  /** When true, every product ships free. */
  allProducts: boolean;
  /** Product slugs that ship free (used when allProducts is false). */
  productIds: string[];
}

export interface IPurchasePopup {
  /** Show the "someone just bought" popup on the storefront. */
  enabled: boolean;
  /** Minutes between popup appearances (1–60). */
  intervalMinutes: number;
}

export interface ISiteSettings extends Document {
  key: string;
  shipping: IShipping;
  freeShipping: IFreeShipping;
  purchasePopup: IPurchasePopup;
  flashSale: IFlashSale;
  summerSale: ISummerSale;
  heroSlides: IHeroSlide[];
  announcementBar: { active: boolean; text: string; link: string };
  trustBadges: ITrustBadge[];
  headings: { categoriesTitle: string; newArrivalsTitle: string; bestSellersTitle: string };
  footer: { aboutText: string; copyrightText: string };
  promoTiles: IPromoTile[];
}

const ShippingSchema = new Schema<IShipping>(
  {
    insideDhaka: { type: Number, default: 70 },
    outsideDhaka: { type: Number, default: 120 },
  },
  { _id: false }
);

const FreeShippingSchema = new Schema<IFreeShipping>(
  {
    active: { type: Boolean, default: false },
    endsAt: { type: Date },
    allProducts: { type: Boolean, default: false },
    productIds: { type: [String], default: [] },
  },
  { _id: false }
);

const PurchasePopupSchema = new Schema<IPurchasePopup>(
  {
    enabled: { type: Boolean, default: true },
    intervalMinutes: { type: Number, default: 5 },
  },
  { _id: false }
);

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    image: { type: String, required: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    buttonText: { type: String, default: "Shop Now" },
    buttonLink: { type: String, default: "/shop" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const FlashSaleSchema = new Schema<IFlashSale>(
  {
    active: { type: Boolean, default: true },
    title: { type: String, default: "Flash Sale" },
    subtitle: { type: String, default: "" },
    discountText: { type: String, default: "Up To 70% Off" },
    endsAt: { type: Date },
    buttonText: { type: String, default: "Shop Sale Now" },
    buttonLink: { type: String, default: "/shop?onSale=1" },
  },
  { _id: false }
);

const SummerSaleSchema = new Schema<ISummerSale>(
  {
    active: { type: Boolean, default: true },
    title: { type: String, default: "Summer Sale" },
    subtitle: { type: String, default: "" },
    discountText: { type: String, default: "Up To 50% Off" },
    endsAt: { type: Date },
    buttonText: { type: String, default: "Shop Summer Sale" },
    buttonLink: { type: String, default: "/shop?sale=summer" },
    bannerImage: { type: String, default: "" },
    themeColor: { type: String, default: "#f59e0b" },
    productIds: { type: [String], default: [] },
    categories: { type: [String], default: [] },
  },
  { _id: false }
);

const TrustBadgeSchema = new Schema<ITrustBadge>(
  {
    icon: { type: String, default: "" },
    title: { type: String, default: "" },
    sub: { type: String, default: "" },
  },
  { _id: false }
);

const PromoTileSchema = new Schema<IPromoTile>(
  {
    image: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    buttonText: { type: String, default: "Shop Now" },
    buttonLink: { type: String, default: "/shop" },
    bg: { type: String, default: "" },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true },
    shipping: { type: ShippingSchema, default: () => ({}) },
    freeShipping: { type: FreeShippingSchema, default: () => ({}) },
    purchasePopup: { type: PurchasePopupSchema, default: () => ({}) },
    flashSale: { type: FlashSaleSchema, default: () => ({}) },
    summerSale: { type: SummerSaleSchema, default: () => ({}) },
    heroSlides: { type: [HeroSlideSchema], default: [] },
    announcementBar: {
      type: new Schema(
        { active: { type: Boolean, default: false }, text: { type: String, default: "" }, link: { type: String, default: "/shop" } },
        { _id: false }
      ),
      default: () => ({ active: false, text: "", link: "/shop" }),
    },
    trustBadges: { type: [TrustBadgeSchema], default: [] },
    headings: {
      type: new Schema(
        {
          categoriesTitle: { type: String, default: "Shop by Categories" },
          newArrivalsTitle: { type: String, default: "New Arrivals" },
          bestSellersTitle: { type: String, default: "Best Sellers" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    footer: {
      type: new Schema(
        {
          aboutText: { type: String, default: "" },
          copyrightText: { type: String, default: "" },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    promoTiles: { type: [PromoTileSchema], default: [] },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ??
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
