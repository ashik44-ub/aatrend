export const dynamic = "force-dynamic";

// The admin guard + sidebar live in (dashboard)/layout.tsx so that
// /admin/login stays reachable when logged out.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
