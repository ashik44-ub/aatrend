import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IReview {
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: Date;
}

export interface IVariant {
  type: "size" | "color";
  value: string;
}

export interface IColor {
  name: string;
  hex: string;
}

export type ProductStatus = "in_stock" | "pre_order" | "sold_out";
export type ProductBadge = "sale" | "hot" | "new" | null;

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  priceTo?: number;
  category: string;
  subcategory?: string;
  brand?: string;
  images: string[];
  stock: number;
  variants: IVariant[];
  colors: IColor[];
  sizes: string[];
  status: ProductStatus;
  badge: ProductBadge;
  dealEndsAt?: Date;
  rating: number;
  reviewCount: number;
  reviews: IReview[];
  featured: boolean;
  bestSeller: boolean;
  isNewArrival: boolean;
  onSale: boolean;
  sold: number;
  specifications: { label: string; value: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    price: { type: Number, required: true },
    comparePrice: { type: Number },
    priceTo: { type: Number },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, index: true },
    brand: { type: String, index: true },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
    variants: {
      type: [{ type: { type: String, enum: ["size", "color"] }, value: String }],
      default: [],
    },
    colors: {
      type: [{ name: String, hex: String }],
      default: [],
    },
    sizes: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["in_stock", "pre_order", "sold_out"],
      default: "in_stock",
    },
    badge: {
      type: String,
      enum: ["sale", "hot", "new", null],
      default: null,
    },
    dealEndsAt: { type: Date },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviews: { type: [ReviewSchema], default: [] },
    featured: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    onSale: { type: Boolean, default: false },
    sold: { type: Number, default: 0 },
    specifications: {
      type: [{ label: String, value: String }],
      default: [],
    },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text", category: "text" });

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);

export { CATEGORIES, FASHION_SUBCATEGORIES, BRANDS, APPAREL_SIZES, colorHex } from "@/lib/categories";
