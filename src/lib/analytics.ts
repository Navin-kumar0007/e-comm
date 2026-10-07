import { prisma } from "@/lib/db/prisma";

/** Orders that count as real sales (confirmed and not cancelled/expired/unpaid). */
export const BOOKED_STATUSES = ["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED", "RTO"];

export const RANGES = { today: 1, "7d": 7, "30d": 30, "90d": 90 } as const;
export type RangeKey = keyof typeof RANGES;

const round = (n: number) => Math.round(n * 100) / 100;

/** Start of day in India time, `daysBack` days ago (0 = today). */
function istDayStart(daysBack: number) {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 3600_000 - daysBack * 86400_000);
}

const istDateKey = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

export async function getDashboard(range: RangeKey) {
  const days = RANGES[range];
  const since = istDayStart(days - 1);
  const prevSince = istDayStart(2 * days - 1);

  const [orders, refunds, live, openReturns, pendingManualRefunds, pendingReviews, lowStock, recent, prev, prevRefunds] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { in: BOOKED_STATUSES } },
      select: {
        id: true, total: true, status: true, paymentMethod: true, paymentId: true, createdAt: true, customerEmail: true,
        items: { select: { productId: true, productName: true, quantity: true, price: true, weight: true, variantId: true } },
      },
    }),
    prisma.refund.aggregate({ where: { createdAt: { gte: since }, status: { not: "FAILED" } }, _sum: { amount: true } }),
    prisma.order.groupBy({ by: ["status", "paymentMethod"], where: { status: { in: ["PROCESSING", "CONFIRMED", "SHIPPED"] } }, _count: { _all: true }, _sum: { total: true } }),
    prisma.returnRequest.count({ where: { status: { in: ["REQUESTED", "APPROVED"] } } }),
    prisma.refund.count({ where: { method: "MANUAL", status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    getLowStock(),
    prisma.order.findMany({
      where: { status: { notIn: ["DELETED"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, customerName: true, total: true, status: true, createdAt: true },
    }),
    // Same-length period just before, for "vs previous" comparisons.
    prisma.order.aggregate({
      where: { createdAt: { gte: prevSince, lt: since }, status: { in: BOOKED_STATUSES } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.refund.aggregate({ where: { createdAt: { gte: prevSince, lt: since }, status: { not: "FAILED" } }, _sum: { amount: true } }),
  ]);
  const prevGross = round(prev._sum.total ?? 0);
  const prevOrders = prev._count._all;
  const prevNet = round(prevGross - (prevRefunds._sum.amount ?? 0));

  const gross = round(orders.reduce((s: number, o: any) => s + o.total, 0));
  const refunded = round(refunds._sum.amount ?? 0);
  const count = orders.length;

  // RTO rate among orders from this period that have finished their journey.
  const finished = orders.filter((o: any) => ["DELIVERED", "RETURNED", "RTO"].includes(o.status));
  const rto = finished.filter((o: any) => o.status === "RTO").length;

  // Repeat customers: customers in this period with 2+ booked orders ever.
  const emails: string[] = [...new Set<string>(orders.map((o: any) => String(o.customerEmail).toLowerCase()))];
  let repeat = 0;
  if (emails.length) {
    const lifetime = await prisma.order.groupBy({
      by: ["customerEmail"],
      where: { customerEmail: { in: orders.map((o: any) => o.customerEmail) }, status: { in: BOOKED_STATUSES } },
      _count: { _all: true },
    });
    const byEmail = new Map<string, number>();
    for (const row of lifetime as any[]) {
      const k = row.customerEmail.toLowerCase();
      byEmail.set(k, (byEmail.get(k) ?? 0) + row._count._all);
    }
    repeat = emails.filter((e) => (byEmail.get(e) ?? 0) >= 2).length;
  }

  // Top products by revenue, with margin where cost price is known.
  const productIds = [...new Set(orders.flatMap((o: any) => o.items.map((i: any) => i.productId)).filter(Boolean))] as string[];
  const costs = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, costPrice: true, variants: { select: { id: true, costPrice: true } } } })
    : [];
  const costOf = (productId: string | null, variantId: string | null) => {
    const p: any = costs.find((c: any) => c.id === productId);
    if (!p) return null;
    return (variantId && p.variants.find((v: any) => v.id === variantId)?.costPrice) ?? p.costPrice ?? null;
  };
  const top = new Map<string, { name: string; qty: number; revenue: number; cost: number; costKnown: boolean }>();
  for (const o of orders as any[]) {
    for (const i of o.items) {
      if (!i.productId || i.productId.startsWith("custom-")) continue;
      const key = i.productId;
      const row = top.get(key) ?? { name: i.productName, qty: 0, revenue: 0, cost: 0, costKnown: true };
      const c = costOf(i.productId, i.variantId);
      row.qty += i.quantity;
      row.revenue += i.price * i.quantity;
      if (c == null) row.costKnown = false;
      else row.cost += c * i.quantity;
      top.set(key, row);
    }
  }
  const topProducts = [...top.entries()]
    .map(([id, r]) => ({ id, ...r, revenue: round(r.revenue), margin: r.costKnown && r.revenue > 0 ? Math.round(((r.revenue - r.cost) / r.revenue) * 100) : null }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Daily sales series (IST days), zero-filled.
  const daily = new Map<string, { revenue: number; orders: number }>();
  for (let d = days - 1; d >= 0; d--) daily.set(istDateKey(istDayStart(d)), { revenue: 0, orders: 0 });
  for (const o of orders as any[]) {
    const k = istDateKey(o.createdAt);
    const row = daily.get(k);
    if (row) {
      row.revenue += o.total;
      row.orders += 1;
    }
  }

  const liveCount = (statuses: string[]) => (live as any[]).filter((l) => statuses.includes(l.status)).reduce((s, l) => s + l._count._all, 0);
  const codToCollect = round((live as any[]).filter((l) => l.paymentMethod === "COD").reduce((s, l) => s + (l._sum.total ?? 0), 0));

  return {
    range,
    gross,
    refunded,
    net: round(gross - refunded),
    orders: count,
    aov: count ? round(gross / count) : 0,
    customers: emails.length,
    repeatRate: emails.length ? Math.round((repeat / emails.length) * 100) : 0,
    rtoRate: finished.length ? Math.round((rto / finished.length) * 100) : null,
    codShare: count ? Math.round((orders.filter((o: any) => o.paymentMethod === "COD").length / count) * 100) : 0,
    toShip: liveCount(["PROCESSING", "CONFIRMED"]),
    inTransit: liveCount(["SHIPPED"]),
    codToCollect,
    openReturns,
    pendingManualRefunds,
    pendingReviews,
    lowStock,
    topProducts,
    daily: [...daily.entries()].map(([date, v]) => ({ date, revenue: round(v.revenue), orders: v.orders })),
    recent,
    previous: { net: prevNet, orders: prevOrders, aov: prevOrders ? round(prevGross / prevOrders) : 0 },
  };
}

async function getLowStock() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, stock: true, weight: true, lowStockThreshold: true, variants: { where: { isActive: true }, select: { id: true, label: true, stock: true } } },
  });
  const rows: Array<{ id: string; name: string; label: string; stock: number }> = [];
  for (const p of products as any[]) {
    if (p.variants.length) {
      for (const v of p.variants) if (v.stock <= p.lowStockThreshold) rows.push({ id: p.id, name: p.name, label: v.label, stock: v.stock });
    } else if (p.stock <= p.lowStockThreshold) {
      rows.push({ id: p.id, name: p.name, label: p.weight ?? "", stock: p.stock });
    }
  }
  return rows.sort((a, b) => a.stock - b.stock).slice(0, 10);
}
