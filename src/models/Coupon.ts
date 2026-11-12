import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CouponType = "percent" | "fixed";

export interface ICoupon extends Document {
  code: string;
  /** Legacy percent field, kept in sync when type is "percent". */
  percent: number;
  type: CouponType;
  /** Discount value: percent (1-90) when type is "percent", amount in ৳ (Taka) when "fixed". */
  value: number;
  minOrder: number;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percent: { type: Number, required: true, min: 0, max: 90, default: 10 },
    type: { type: String, enum: ["percent", "fixed"], default: "percent" },
    value: { type: Number, required: true, min: 0, default: 10 },
    minOrder: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** Discount amount for a coupon against a subtotal (0 when unusable). Whole Taka. */
export function couponDiscount(coupon: Pick<ICoupon, "type" | "value" | "percent">, subtotal: number): number {
  if (coupon.type === "fixed") return Math.min(coupon.value, subtotal);
  const pct = coupon.type === "percent" ? coupon.value : coupon.percent;
  return Math.round((subtotal * pct) / 100);
}

/** Is the coupon usable right now (ignoring minOrder, which needs a subtotal)? */
export function couponUsable(
  coupon: Pick<ICoupon, "active" | "expiresAt" | "usageLimit" | "usedCount">
): string | null {
  if (!coupon.active) return "This coupon is not active.";
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return "This coupon has expired.";
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return "This coupon has reached its usage limit.";
  return null;
}

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon ?? mongoose.model<ICoupon>("Coupon", CouponSchema);
