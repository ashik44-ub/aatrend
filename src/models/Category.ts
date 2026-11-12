import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CategoryGroup = "category" | "subcategory";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image: string;
  tagline: string;
  description: string;
  group: CategoryGroup;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    image: { type: String, default: "" },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    group: { type: String, enum: ["category", "subcategory"], default: "category" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A name like "Accessories" can be both a main category and a fashion
// sub-category — uniqueness is per group, not global.
CategorySchema.index({ slug: 1, group: 1 }, { unique: true });

export const Category: Model<ICategory> =
  mongoose.models.Category ?? mongoose.model<ICategory>("Category", CategorySchema);
