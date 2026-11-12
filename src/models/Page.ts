import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PageSlug = "about" | "contact" | "terms";

export interface IPage extends Document {
  slug: PageSlug;
  title: string;
  content: string;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, unique: true, enum: ["about", "contact", "terms"] },
    title: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Page: Model<IPage> =
  mongoose.models.Page ?? mongoose.model<IPage>("Page", PageSchema);
