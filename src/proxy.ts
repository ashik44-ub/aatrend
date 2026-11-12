import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdministrationAllowedPath } from "@/lib/roles";

/**
 * Role enforcement at the edge, before any admin page or API runs.
 * The dashboard layout + each API route re-check the role server-side
 * (fresh from the DB), so this is the first of two layers.
 *
 * - No token → /admin/login (pages) or 401 (APIs).
 * - customer → storefront "/" (pages) or 403 (APIs).
 * - administration → only Products, Orders, Shipping, Free Shipping.
 * - admin → everything.
 */
const STAFF_API_PREFIXES = ["/api/admin/products", "/api/admin/orders", "/api/admin/shipping", "/api/admin/notifications"];

function isStaffApiAllowed(pathname: string): boolean {
  return STAFF_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/admin");
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = (token?.role as string) ?? "";

  const denyApi = (status: number) =>
    NextResponse.json({ error: status === 401 ? "Unauthorized." : "Forbidden." }, { status });
  const denyPage = (url: string) => NextResponse.redirect(new URL(url, req.url));

  // The login page itself is always reachable; signed-in staff go to their landing page.
  if (pathname === "/admin/login") {
    if (role === "admin") return denyPage("/admin");
    if (role === "administration") return denyPage("/admin/products");
    return NextResponse.next();
  }

  if (!token) return isApi ? denyApi(401) : denyPage("/admin/login");
  if (role !== "admin" && role !== "administration") {
    return isApi ? denyApi(403) : denyPage("/");
  }
  if (role === "administration") {
    if (isApi) {
      if (!isStaffApiAllowed(pathname)) return denyApi(403);
    } else if (!isAdministrationAllowedPath(pathname)) {
      return denyPage("/admin/products");
    }
  }

  // Pass the current path to server components so the dashboard layout can
  // re-check the section server-side (defense in depth).
  const headers = new Headers(req.headers);
  headers.set("x-admin-path", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
