import bcrypt from "bcryptjs";
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { Role } from "@/lib/roles";

export type { Role } from "@/lib/roles";
export { ADMINISTRATION_PATHS, isAdministrationAllowedPath } from "@/lib/roles";

/**
 * Roles:
 * - admin: full access (env-based main admin + DB users with role "admin").
 * - administration: limited staff — products, orders and shipping only.
 * - customer: shoppers, no admin access.
 *
 * The env-based admin (ADMIN_EMAIL / ADMIN_PASSWORD) is always a full
 * admin. DB users carry their role from the database; the role is resolved
 * fresh from the DB on every server-side check, so a role change takes
 * effect without the user having to sign in again (the JWT in the cookie
 * may still carry the old role until the next sign-in).
 */

export interface AuthContext {
  session: Session | null;
  role: Role;
  userId: string;
  email: string;
  isEnvAdmin: boolean;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string; role?: string } | undefined;
  if (!user?.email) return null;
  const isEnvAdmin = user.id === "admin";
  let role = (user.role as Role) ?? "customer";
  if (!isEnvAdmin && user.id) {
    // Resolve the role fresh from the DB so role changes apply immediately.
    try {
      await connectDB();
      const dbUser = await User.findById(user.id).select("role").lean();
      if (dbUser?.role) role = dbUser.role as Role;
    } catch {
      // DB unreachable: fall back to the JWT role.
    }
  } else if (isEnvAdmin) {
    role = "admin";
  }
  if (role !== "admin" && role !== "administration") role = "customer";
  return { session, role, userId: user.id ?? "", email: user.email, isEnvAdmin };
}

export async function getAdminSession() {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "admin") return null;
  return ctx.session;
}

export async function getStaffSession() {
  const ctx = await getAuthContext();
  if (!ctx || (ctx.role !== "admin" && ctx.role !== "administration")) return null;
  return ctx.session;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
          return { id: "admin", name: "Admin", email: adminEmail, role: "admin" };
        }

        await connectDB();
        const user = await User.findOne({ email }).lean();
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "customer";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = (token.role as string) ?? "customer";
        (session.user as { id?: string }).id = (token.id as string) ?? "";
      }
      return session;
    },
  },
};
