import { requirePagePermission } from "@/lib/auth-guard";
import Link from "next/link";
import { ArrowUpRight, IndianRupee, ShoppingCart, Truck, PackageCheck, RotateCcw, Star, Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDashboard, RANGES, type RangeKey } from "@/lib/analytics";
import { releaseStaleOrders } from "@/lib/orders";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status-rules";
import { SalesChart } from "./sales-chart";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const RANGE_LABELS: Record<RangeKey, string> = { today: "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days" };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string; denied?: string }> }) {
  const staff = await requirePagePermission("dashboard.view");
  const showReports = staff.can("reports.view");
  const { range: rangeParam, denied } = await searchParams;
  const range = (rangeParam && rangeParam in RANGES ? rangeParam : "30d") as RangeKey;
  // Fallback for when no cron is configured: expire abandoned online checkouts.
  try { await releaseStaleOrders(10); } catch (e) { console.error("Stale order sweep failed:", e); }
  const d = await getDashboard(range);

  const kpis = [
    { label: "Net sales", value: inr(d.net), hint: d.refunded ? `${inr(d.gross)} gross − ${inr(d.refunded)} refunds` : "Confirmed orders, after refunds", icon: IndianRupee },
    { label: "Orders", value: String(d.orders), hint: `Avg order ${inr(d.aov)} · ${d.codShare}% COD`, icon: ShoppingCart },
    { label: "Customers", value: String(d.customers), hint: `${d.repeatRate}% are repeat buyers`, icon: Users },
    { label: "RTO rate", value: d.rtoRate === null ? "—" : `${d.rtoRate}%`, hint: "Returned undelivered, of finished orders", icon: AlertTriangle },
  ];

  const actions = [
    { label: "To ship", value: d.toShip, href: "/admin/orders?status=Processing", icon: PackageCheck },
    { label: "In transit", value: d.inTransit, href: "/admin/orders?status=Shipped", icon: Truck, hint: d.codToCollect ? `${inr(d.codToCollect)} COD to collect` : undefined },
    { label: "Open returns", value: d.openReturns, href: "/admin/returns", icon: RotateCcw, hint: d.pendingManualRefunds ? `${d.pendingManualRefunds} manual refund(s) to pay` : undefined },
    { label: "Reviews to check", value: d.pendingReviews, href: "/admin/reviews", icon: Star },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Sales from confirmed orders (paid online or COD), in India time</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          {(Object.keys(RANGES) as RangeKey[]).map((r) => (
            <Link key={r} href={`/admin?range=${r}`} className={`px-3 py-1.5 rounded-lg text-sm ${r === range ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}>
              {RANGE_LABELS[r]}
            </Link>
          ))}
        </div>
      </div>

      {denied && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
          Your role doesn&apos;t have access to that page. Ask the store owner if you need it.
        </div>
      )}

      {/* Needs attention */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((a) => (
          <Link key={a.label} href={a.href} className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">{a.label}</p>
              <a.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className={`text-3xl font-bold mt-1 tabular-nums ${a.value > 0 ? "text-foreground" : "text-muted-foreground"}`}>{a.value}</p>
            {a.hint && <p className="text-xs text-muted-foreground mt-1">{a.hint}</p>}
          </Link>
        ))}
      </div>

      {/* KPIs for the period */}
      {showReports && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">{k.label}</p>
              <k.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold mt-1 text-foreground tabular-nums">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.hint}</p>
          </div>
        ))}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {showReports && (
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-foreground mb-6">Daily sales</h2>
          <SalesChart data={d.daily} />
        </div>
        )}

        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-bold text-foreground">Low stock</h2>
            <Link href="/admin/inventory" className="text-sm text-primary hover:underline flex items-center gap-1">Inventory <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          {d.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">All products are above their alert level ✓</p>
          ) : (
            <div className="space-y-2">
              {d.lowStock.map((p) => (
                <div key={`${p.id}-${p.label}`} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.label}</div>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${p.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {p.stock <= 0 ? "Out" : `${p.stock} left`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {showReports && (
        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <h2 className="text-lg font-heading font-bold text-foreground mb-4">Top products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-xs text-muted-foreground">
                <tr><th className="py-2 text-left">Product</th><th className="py-2 text-right">Units</th><th className="py-2 text-right">Sales</th><th className="py-2 text-right">Margin</th></tr>
              </thead>
              <tbody>
                {d.topProducts.map((p) => (
                  <tr key={p.id} className="border-t border-border/30">
                    <td className="py-2.5 pr-2"><Link href={`/admin/products/edit/${p.id}`} className="hover:underline">{p.name}</Link></td>
                    <td className="py-2.5 text-right">{p.qty}</td>
                    <td className="py-2.5 text-right">{inr(p.revenue)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{p.margin === null ? "—" : `${p.margin}%`}</td>
                  </tr>
                ))}
                {d.topProducts.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No sales in this period</td></tr>}
              </tbody>
            </table>
          </div>
          {d.topProducts.some((p) => p.margin === null) && (
            <p className="text-[11px] text-muted-foreground mt-3">Margin shows once a cost price is set on the product.</p>
          )}
        </div>
        )}

        <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-bold text-foreground">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {d.recent.map((o: any) => (
                <tr key={o.id} className="border-t border-border/30 first:border-0">
                  <td className="py-2.5"><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">#{o.id.slice(-8).toUpperCase()}</Link></td>
                  <td className="py-2.5 text-muted-foreground truncate max-w-[140px]">{o.customerName}</td>
                  <td className="py-2.5 text-right tabular-nums">{inr(o.total)}</td>
                  <td className="py-2.5 text-right"><Badge variant="outline" className="text-xs">{ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status}</Badge></td>
                </tr>
              ))}
              {d.recent.length === 0 && <tr><td className="py-6 text-center text-muted-foreground">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
