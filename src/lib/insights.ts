import { prisma } from "@/lib/db/prisma";
import { BOOKED_STATUSES } from "@/lib/analytics";
import { computeInvoice } from "@/lib/invoice";
import { getStoreSettings } from "@/lib/store-settings";
import { parseAddress } from "@/lib/shipping/service";
import { r2, ymOf, lastMonths } from "@/lib/finance-core";

/** Sold and kept: returns and undelivered parcels don't count as sales of the product. */
const KEPT = ["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED"];

export async function getInsights(days: number) {
  const since = new Date(Date.now() - days * 864e5);
  const settings = await getStoreSettings();

  const [orders, allBooked, products, abandonedRaw] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { in: BOOKED_STATUSES } },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { status: { in: BOOKED_STATUSES } },
      select: { id: true, customerEmail: true, customerName: true, customerPhone: true, total: true, createdAt: true, couponCode: true, userId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.product.findMany({ select: { id: true, name: true, stock: true, costPrice: true, variants: { select: { id: true, label: true, stock: true, costPrice: true } } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 14 * 864e5) }, paymentMethod: "ONLINE", status: { in: ["EXPIRED", "FAILED", "PENDING"] } },
      include: { items: { select: { productName: true, quantity: true, weight: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // ── Profit per product and pack size ──
  const kept = orders.filter((o: any) => KEPT.includes(o.status));
  const allocations = await prisma.lotAllocation.findMany({
    where: { orderId: { in: kept.map((o: any) => o.id) }, qty: { gt: 0 } },
    select: { orderId: true, qty: true, unitCost: true, lot: { select: { productId: true, variantId: true } } },
  });
  const pById = new Map(products.map((p: any) => [p.id, p]));
  const rows = new Map<string, { key: string; productId: string | null; name: string; pack: string; units: number; revenue: number; cogs: number; costKnown: boolean; stock: number | null }>();
  for (const o of kept as any[]) {
    const inv = computeInvoice(o, settings);
    o.items.forEach((it: any, i: number) => {
      const key = `${it.productId ?? it.productName}|${it.variantId ?? it.weight}`;
      const p: any = it.productId ? pById.get(it.productId) : null;
      const v = p && it.variantId ? p.variants.find((x: any) => x.id === it.variantId) : null;
      const row = rows.get(key) ?? { key, productId: it.productId, name: p?.name ?? it.productName, pack: v?.label ?? it.weight, units: 0, revenue: 0, cogs: 0, costKnown: true, stock: v ? v.stock : p && !p.variants.length ? p.stock : null };
      row.units += it.quantity;
      row.revenue += inv.lines[i]?.taxable ?? 0;
      const mine = allocations.filter((a: any) => a.orderId === o.id && a.lot.productId === it.productId && (a.lot.variantId ?? null) === (it.variantId ?? null));
      const fromLots = mine.reduce((s: number, a: any) => s + a.qty, 0);
      row.cogs += mine.reduce((s: number, a: any) => s + a.qty * a.unitCost, 0);
      const rest = Math.max(0, it.quantity - fromLots);
      const unitCost = v?.costPrice ?? p?.costPrice ?? null;
      if (rest) {
        if (unitCost === null || unitCost === undefined) row.costKnown = false;
        else row.cogs += rest * unitCost;
      }
      rows.set(key, row);
    });
  }
  const productRows = [...rows.values()]
    .map((r) => {
      const perDay = r.units / days;
      return {
        ...r, revenue: r2(r.revenue), cogs: r2(r.cogs), profit: r2(r.revenue - r.cogs),
        margin: r.revenue ? r2(((r.revenue - r.cogs) / r.revenue) * 100) : 0,
        daysOfStock: r.stock !== null && perDay > 0 ? Math.floor(r.stock / perDay) : null,
      };
    })
    .sort((a, b) => b.profit - a.profit);

  // ── Customers ──
  const byEmail = new Map<string, { email: string; name: string; phone: string; orders: number; spend: number; first: Date; last: Date }>();
  for (const o of allBooked as any[]) {
    const k = o.customerEmail.toLowerCase();
    const c = byEmail.get(k) ?? { email: o.customerEmail, name: o.customerName, phone: o.customerPhone, orders: 0, spend: 0, first: o.createdAt, last: o.createdAt };
    c.orders++;
    c.spend += o.total;
    c.last = o.createdAt;
    byEmail.set(k, c);
  }
  const customers = [...byEmail.values()];
  const inRange = customers.filter((c) => c.last >= since);
  const newInRange = customers.filter((c) => c.first >= since);
  const repeaters = customers.filter((c) => c.orders >= 2);
  const topCustomers = [...customers].sort((a, b) => b.spend - a.spend).slice(0, 15).map((c) => ({ ...c, spend: r2(c.spend), aov: r2(c.spend / c.orders) }));
  // Cohorts: customers by month of first order, and how many came back later.
  const months = lastMonths(6);
  const cohorts = months.map((m) => {
    const group = customers.filter((c) => ymOf(c.first) === m);
    const back = group.filter((c) => c.orders >= 2).length;
    return { month: m, customers: group.length, returned: back, rate: group.length ? Math.round((back / group.length) * 100) : 0, spend: r2(group.reduce((s, c) => s + c.spend, 0)) };
  });

  // ── Regions and undelivered parcels ──
  const states = new Map<string, { state: string; orders: number; revenue: number; finished: number; rto: number }>();
  const pins = new Map<string, { pincode: string; city: string; finished: number; rto: number }>();
  for (const o of orders as any[]) {
    const a = parseAddress(o);
    const st = (a.state || "Unknown").trim();
    const s = states.get(st) ?? { state: st, orders: 0, revenue: 0, finished: 0, rto: 0 };
    s.orders++;
    s.revenue += o.total;
    if (["DELIVERED", "RETURNED", "RTO"].includes(o.status)) s.finished++;
    if (o.status === "RTO") s.rto++;
    states.set(st, s);
    if (a.pincode && ["DELIVERED", "RTO"].includes(o.status)) {
      const pc = pins.get(a.pincode) ?? { pincode: a.pincode, city: a.city, finished: 0, rto: 0 };
      pc.finished++;
      if (o.status === "RTO") pc.rto++;
      pins.set(a.pincode, pc);
    }
  }
  const stateRows = [...states.values()].map((s) => ({ ...s, revenue: r2(s.revenue), rtoRate: s.finished ? Math.round((s.rto / s.finished) * 100) : null })).sort((a, b) => b.revenue - a.revenue);
  const rtoPins = [...pins.values()].filter((p) => p.rto > 0).map((p) => ({ ...p, rate: Math.round((p.rto / p.finished) * 100) })).sort((a, b) => b.rto - a.rto || b.rate - a.rate).slice(0, 10);

  // ── Coupons ──
  const firstOrderId = new Set<string>();
  {
    const seen = new Set<string>();
    for (const o of allBooked as any[]) {
      const k = o.customerEmail.toLowerCase();
      if (!seen.has(k)) { seen.add(k); firstOrderId.add(o.id); }
    }
  }
  const coupons = new Map<string, { code: string; orders: number; discount: number; revenue: number; newCustomers: number }>();
  for (const o of orders as any[]) {
    if (!o.couponCode) continue;
    const c = coupons.get(o.couponCode) ?? { code: o.couponCode, orders: 0, discount: 0, revenue: 0, newCustomers: 0 };
    c.orders++;
    c.discount += o.discount || 0;
    c.revenue += o.total;
    if (firstOrderId.has(o.id)) c.newCustomers++;
    coupons.set(o.couponCode, c);
  }
  const couponRows = [...coupons.values()].map((c) => ({ ...c, discount: r2(c.discount), revenue: r2(c.revenue), aov: r2(c.revenue / c.orders), returnPerRupee: c.discount ? r2(c.revenue / c.discount) : null })).sort((a, b) => b.revenue - a.revenue);

  // ── Abandoned checkouts: unpaid online orders with no later paid order from the same person ──
  const paidAfter = (email: string, at: Date) => (allBooked as any[]).some((o) => o.customerEmail.toLowerCase() === email.toLowerCase() && o.createdAt > at);
  const seenAb = new Set<string>();
  const abandoned = (abandonedRaw as any[])
    .filter((o) => !paidAfter(o.customerEmail, o.createdAt))
    .filter((o) => { const k = o.customerEmail.toLowerCase(); if (seenAb.has(k)) return false; seenAb.add(k); return true; })
    .slice(0, 30)
    .map((o) => ({
      id: o.id, name: o.customerName, email: o.customerEmail, phone: o.customerPhone, total: o.total, createdAt: o.createdAt,
      items: o.items.map((i: any) => `${i.productName} ${i.weight}×${i.quantity}`).join(", "),
    }));

  const revenue = r2(productRows.reduce((s, r) => s + r.revenue, 0));
  const profit = r2(productRows.reduce((s, r) => s + r.profit, 0));
  return {
    days,
    summary: {
      revenue, profit, margin: revenue ? r2((profit / revenue) * 100) : 0,
      customers: inRange.length, newCustomers: newInRange.length,
      repeatRate: customers.length ? Math.round((repeaters.length / customers.length) * 100) : 0,
      avgLifetimeValue: customers.length ? r2(customers.reduce((s, c) => s + c.spend, 0) / customers.length) : 0,
      unknownCost: productRows.filter((r) => !r.costKnown).length,
      abandonedValue: r2(abandoned.reduce((s, a) => s + a.total, 0)),
    },
    productRows, topCustomers, cohorts, stateRows, rtoPins, couponRows, abandoned,
  };
}
