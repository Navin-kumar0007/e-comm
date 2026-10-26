import { requirePagePermission } from "@/lib/auth-guard";
import { getDashboard, getStockMap, RANGES, type RangeKey } from "@/lib/analytics";
import { releaseStaleOrders } from "@/lib/orders";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status-rules";
import { DashboardView, type DashboardData } from "./command/dashboard-view";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const RANGE_LABELS: Record<RangeKey, string> = { today: "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days" };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string; denied?: string }> }) {
  const staff = await requirePagePermission("dashboard.view");
  const showReports = staff.can("reports.view");
  const { range: rangeParam, denied } = await searchParams;
  const range = (rangeParam && rangeParam in RANGES ? rangeParam : "30d") as RangeKey;
  // Fallback for when no cron is configured: expire abandoned online checkouts.
  try { await releaseStaleOrders(10); } catch (e) { console.error("Stale order sweep failed:", e); }
  const [d, stock] = await Promise.all([getDashboard(range), getStockMap()]);

  const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);
  const data: DashboardData = {
    firstName: staff.user.name?.split(" ")[0] || "there",
    range,
    ranges: (Object.keys(RANGES) as RangeKey[]).map((key) => ({ key, label: RANGE_LABELS[key] })),
    periodLabel: RANGE_LABELS[range].toLowerCase(),
    denied: Boolean(denied),
    showReports,
    actions: [
      { label: "To ship", value: d.toShip, href: "/admin/orders?status=Processing", icon: "pack" },
      { label: "In transit", value: d.inTransit, href: "/admin/orders?status=Shipped", icon: "truck", calm: "On the way", hint: d.codToCollect ? `${inr(d.codToCollect)} COD to collect` : undefined },
      { label: "Open returns", value: d.openReturns, href: "/admin/returns", icon: "returns", hint: d.pendingManualRefunds ? `${d.pendingManualRefunds} manual refund(s) to pay` : undefined },
      { label: "Reviews to check", value: d.pendingReviews, href: "/admin/reviews", icon: "star" },
    ],
    kpis: [
      { label: "Net sales", value: d.net, money: true, hint: d.refunded ? `${inr(d.gross)} gross − ${inr(d.refunded)} refunds` : "Confirmed orders, after refunds", icon: "rupee", delta: change(d.net, d.previous.net), spark: d.daily.map((p) => p.revenue) },
      { label: "Orders", value: d.orders, hint: `Avg order ${inr(d.aov)} · ${d.codShare}% COD`, icon: "cart", delta: change(d.orders, d.previous.orders), spark: d.daily.map((p) => p.orders) },
      { label: "Customers", value: d.customers, ring: d.customers ? d.repeatRate : undefined, hint: `${d.repeatRate}% are repeat buyers`, icon: "users", delta: null },
      { label: "RTO rate", value: d.rtoRate ?? 0, percent: true, empty: d.rtoRate === null, ring: d.rtoRate ?? undefined, hint: "Returned undelivered, of finished orders", icon: "alert", delta: null },
    ],
    codShare: d.codShare,
    orders: d.orders,
    daily: d.daily,
    lowStock: d.lowStock,
    topProducts: d.topProducts.map((p) => ({ id: p.id, name: p.name, qty: p.qty, revenue: p.revenue, margin: p.margin })),
    recent: (d.recent as any[]).map((o) => ({
      id: o.id,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      statusLabel: ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status,
      createdAt: new Date(o.createdAt).toISOString(),
    })),
    stock,
  };

  return <DashboardView data={data} />;
}
