import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant?: string;
}

export type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  /** "inside-dhaka" | "outside-dhaka" — decides which shipping rate applied. */
  deliveryArea: "inside-dhaka" | "outside-dhaka";
  /** True when the order shipped free under the admin's free-shipping campaign. */
  freeShipping: boolean;
  /** True once an admin has opened this order in the admin panel. */
  viewed: boolean;
  total: number;
  couponCode?: string;
  paymentMethod: "COD" | "Card";
  status: OrderStatus;
  shippingAddress: {
    address: string;
    city: string;
    zip: string;
    country: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, index: true },
    items: {
      type: [
        {
          productId: String,
          name: String,
          image: String,
          price: Number,
          quantity: Number,
          variant: String,
        },
      ],
      default: [],
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: false },
    /** False until an admin opens the order detail page. */
    viewed: { type: Boolean, default: false },
    deliveryArea: {
      type: String,
      enum: ["inside-dhaka", "outside-dhaka"],
      default: "inside-dhaka",
    },
    total: { type: Number, required: true },
    couponCode: { type: String },
    paymentMethod: { type: String, enum: ["COD", "Card"], default: "COD" },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    shippingAddress: {
      address: String,
      city: String,
      zip: String,
      country: String,
      phone: String,
    },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);
