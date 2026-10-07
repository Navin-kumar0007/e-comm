import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getStaffContext } from "@/lib/auth-guard";
import { PERMISSIONS, ROLE_LABELS } from "@/lib/permissions";
import { AdminNav } from "./admin-nav";
import { AdminSearch } from "./admin-search";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Role is read fresh from the database, so removed staff lose access immediately.
  const staff = await getStaffContext();
  if (!staff) {
    const session = await auth();
    redirect(session?.user ? "/" : "/login");
  }
  const permissions = PERMISSIONS.filter((p) => staff.can(p));
  const nav = <AdminNav permissions={permissions} staffName={staff.user.name || staff.user.email} roleName={ROLE_LABELS[staff.role].name} />;

  return (
    <div className="admin-shell flex h-screen bg-[#f6f3ee] text-foreground print:block print:h-auto print:bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block print:hidden">{nav}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-white/90 px-4 backdrop-blur sm:px-6 print:hidden">
          <Sheet>
            <SheetTrigger aria-label="Open menu" className="-ml-1 rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-r-0 p-0" showCloseButton={false}>
              {nav}
            </SheetContent>
          </Sheet>
          <AdminSearch />
          <div className="ml-auto flex items-center gap-2">
            {staff.can("orders.create") && (
              <Link href="/admin/orders/new" className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#6E1A2C] px-3 text-[13px] font-semibold text-white hover:bg-[#5a1424]">
                <Plus className="h-4 w-4" /> New order
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
