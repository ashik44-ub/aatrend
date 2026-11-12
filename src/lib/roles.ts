/**
 * Role + section rules shared by the Edge middleware and the server code.
 * This file must stay free of Node-only imports (no mongoose, no bcrypt)
 * so the middleware can use it.
 */
export type Role = "customer" | "administration" | "admin";

/** Admin sections an "administration" user may open. Everything else is admin-only. */
export const ADMINISTRATION_PATHS = [
  "/admin/products",
  "/admin/orders",
  "/admin/shipping",
  "/admin/free-shipping",
  "/admin/purchase-popups",
];

export function isAdministrationAllowedPath(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/admin";
  if (path === "/admin") return false; // dashboard home is admin-only; staff land on Products
  return ADMINISTRATION_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}
