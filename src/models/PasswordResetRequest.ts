import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/**
 * Password reset request (no email is ever sent — the site has no mailer).
 *
 * Flow: a user asks for a reset on /forgot-password → we store ONLY the
 * SHA-256 hash of a random token (the raw token is never persisted), valid
 * for 1 hour, single-use. The admin sees pending requests in
 * Admin → Users & Roles, copies the reset link and sends it to the user
 * (WhatsApp/phone), or sets a temporary password directly.
 *
 * A request is "pending" while usedAt and handledAt are both null and
 * expiresAt is in the future.
 */
export interface IPasswordResetRequest extends Document {
  user: Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  handledAt: Date | null;
  createdAt: Date;
}

const PasswordResetRequestSchema = new Schema<IPasswordResetRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    handledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Expired requests are dropped automatically by MongoDB (TTL index).
PasswordResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetRequest: Model<IPasswordResetRequest> =
  mongoose.models.PasswordResetRequest ??
  mongoose.model<IPasswordResetRequest>(
    "PasswordResetRequest",
    PasswordResetRequestSchema
  );
