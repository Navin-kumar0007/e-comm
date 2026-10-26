"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, RotateCcw, Users, Repeat, Printer, Warehouse, Barcode, Package, FolderTree,
  ChefHat, ListChecks, Ticket, MessageCircle, Sparkles, Star, MessageSquare, UserCog, Settings, Store,
  Gauge, Wheat, Scissors, Boxes, ClipboardCheck, ClipboardList, Truck, TrendingUp, Receipt, Landmark, HandCoins, Lightbulb, ShieldCheck, History, ScanBarcode, Inbox, ShieldHalf, PanelsTopLeft,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";
import { SignOutButton } from "@/components/sign-out-button";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; permission: Permission | Permission[] };
type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" }] },
  {
    label: "Sales",
    items: [
      { href: "/admin/pos", label: "Counter billing", icon: ScanBarcode, permission: "orders.create" },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders.view" },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw, permission: "returns.manage" },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.view" },
      { href: "/admin/inbox", label: "WhatsApp inbox", icon: Inbox, permission: "customers.view" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat, permission: "customers.view" },
    ],
  },
  {
    label: "Fulfilment",
    items: [{ href: "/admin/fulfilment", label: "Pack & Print", icon: Printer, permission: "orders.view" }],
  },
  {
    label: "Inventory",
    items: [
      { href: "/admin/warehouse", label: "Warehouse", icon: Gauge, permission: "inventory.manage" },
      { href: "/admin/inventory", label: "Stock", icon: Warehouse, permission: "inventory.manage" },
      { href: "/admin/materials", label: "Bulk stock", icon: Wheat, permission: "inventory.manage" },
      { href: "/admin/repack", label: "Pack from bulk", icon: Scissors, permission: "inventory.manage" },
      { href: "/admin/batches", label: "Batches & expiry", icon: Boxes, permission: "inventory.manage" },
      { href: "/admin/stock-counts", label: "Stock counts", icon: ClipboardCheck, permission: "inventory.manage" },
      { href: "/admin/barcodes", label: "Barcodes", icon: Barcode, permission: ["inventory.manage", "catalog.manage"] },
    ],
  },
  {
    label: "Purchasing",
    items: [
      { href: "/admin/purchases", label: "Purchase orders", icon: ClipboardList, permission: "purchases.manage" },
      { href: "/admin/suppliers", label: "Suppliers", icon: Truck, permission: "purchases.manage" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/finance", label: "Profit & cash", icon: TrendingUp, permission: "reports.view" },
      { href: "/admin/expenses", label: "Expenses", icon: Receipt, permission: "finance.manage" },
      { href: "/admin/payments", label: "Payments", icon: HandCoins, permission: "finance.manage" },
      { href: "/admin/gst", label: "GST returns", icon: Landmark, permission: "reports.view" },
      { href: "/admin/insights", label: "Insights", icon: Lightbulb, permission: "reports.view" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/website", label: "Website editor", icon: PanelsTopLeft, permission: "catalog.manage" },
      { href: "/admin/products", label: "Products", icon: Package, permission: "catalog.manage" },
      { href: "/admin/categories", label: "Categories", icon: FolderTree, permission: "catalog.manage" },
      { href: "/admin/recipes", label: "Recipes", icon: ChefHat, permission: "catalog.manage" },
      { href: "/admin/dietary", label: "Dietary Profiles", icon: ListChecks, permission: "catalog.manage" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "marketing.manage" },
      { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle, permission: "marketing.manage" },
      { href: "/admin/points", label: "Spice Points", icon: Sparkles, permission: "marketing.manage" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews.moderate" },
      { href: "/admin/messages", label: "Inquiries", icon: MessageSquare, permission: "customers.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/staff", label: "Staff & Roles", icon: UserCog, permission: "staff.manage" },
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
      { href: "/admin/security", label: "Login security", icon: ShieldCheck, permission: "dashboard.view" },
      { href: "/admin/privacy", label: "Privacy requests", icon: ShieldHalf, permission: "staff.manage" },
      { href: "/admin/audit", label: "Activity log", icon: History, permission: "staff.manage" },
    ],
  },
];

function allowed(item: NavItem, perms: string[]) {
  const need = Array.isArray(item.permission) ? item.permission : [item.permission];
  return need.some((p) => perms.includes(p));
}

/** Sidebar content (used in the desktop rail and the mobile drawer). */
export function AdminNav({ permissions, staffName, roleName }: { permissions: string[]; staffName: string; roleName: string }) {
  const pathname = usePathname() || "/admin";
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <div className="flex h-full flex-col border-r border-white/70 bg-white/50 text-[#3a1a20] shadow-[8px_0_30px_-24px_rgba(110,26,44,0.4)] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-[#6e1a2c]/10 px-5 py-4">
        <span className="flex rounded-lg bg-[#fffdf8] px-2 py-1 ring-1 ring-brand-gold">
          <Image src="/spicy-nuts-logo.png" alt="Spicy Nuts" width={64} height={50} className="h-8 w-auto" />
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-bold tracking-wide text-[#2a0f17]">Operations</p>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-[#8a6420]">Spicy Nuts</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV.map((group) => {
          const items = group.items.filter((i) => allowed(i, permissions));
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6420]/80">{group.label}</p>
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                      active ? "bg-gradient-to-r from-[#6e1a2c] to-[#8a2a3e] text-white shadow-[0_8px_18px_-10px_rgba(110,26,44,0.8)]" : "text-[#5a4046] hover:bg-white/80 hover:text-[#2a0f17]"
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-gold" />}
                    <item.icon className={`h-4 w-4 ${active ? "text-[#e9c987]" : "text-[#9a8478] group-hover:text-[#6e1a2c]"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[#6e1a2c]/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold text-sm font-bold text-[#2a0a12]">
            {staffName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-semibold text-[#2a0f17]">{staffName}</span>
            <span className="block text-[11px] text-[#8a6420]">{roleName}</span>
          </span>
        </div>
        <Link href="/" className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[#5a4046] hover:bg-white/80 hover:text-[#2a0f17]">
          <Store className="h-4 w-4" /> View store
        </Link>
        <SignOutButton className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] text-[#5a4046] hover:bg-white/80 hover:text-[#2a0f17] disabled:opacity-60" />
      </div>
    </div>
  );
}
