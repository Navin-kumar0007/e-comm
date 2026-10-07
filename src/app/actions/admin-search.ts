"use server";

import { prisma } from "@/lib/db/prisma";
import { getStaffContext } from "@/lib/auth-guard";

export interface SearchHit {
  kind: "order" | "product" | "customer";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/** One search box for the whole admin: orders, products and customers the caller may see. */
export async function adminSearchAction(query: string): Promise<SearchHit[]> {
  const staff = await getStaffContext();
  if (!staff) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  const ci = { contains: q, mode: "insensitive" as const };
  const hits: SearchHit[] = [];

  if (staff.can("orders.view")) {
    // Order refs are shown as NW-<last 8 of id>; accept either form.
    const ref = q.replace(/^#?nw-?/i, "").toLowerCase();
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { id: { endsWith: ref } },
          { invoiceNumber: ci },
          { customerName: ci },
          { customerEmail: ci },
          ...(digits.length >= 4 ? [{ customerPhone: { contains: digits } }] : []),
          { trackingNumber: ci },
          { shipments: { some: { awb: ci } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, customerName: true, total: true, status: true, invoiceNumber: true, createdAt: true },
    });
    for (const o of orders) {
      hits.push({
        kind: "order",
        id: o.id,
        title: `#${o.id.slice(-8).toUpperCase()} · ${o.customerName}`,
        subtitle: `₹${Math.round(o.total).toLocaleString("en-IN")} · ${o.status.toLowerCase()}${o.invoiceNumber ? ` · ${o.invoiceNumber}` : ""}`,
        href: `/admin/orders/${o.id}`,
      });
    }
  }

  if (staff.can("catalog.manage") || staff.can("inventory.manage")) {
    const products = await prisma.product.findMany({
      where: {
        status: { not: "CUSTOM" },
        OR: [
          { name: ci },
          { slug: ci },
          { barcode: { contains: q } },
          { hsnCode: { startsWith: q } },
          { variants: { some: { OR: [{ sku: ci }, { barcode: { contains: q } }] } } },
        ],
      },
      take: 6,
      select: { id: true, name: true, stock: true, status: true },
    });
    for (const p of products) {
      hits.push({
        kind: "product",
        id: p.id,
        title: p.name,
        subtitle: `${p.stock} in stock · ${p.status.toLowerCase()}`,
        href: staff.can("catalog.manage") ? `/admin/products/edit/${p.id}` : `/admin/inventory?q=${encodeURIComponent(p.name)}`,
      });
    }
  }

  if (staff.can("customers.view")) {
    const users = await prisma.user.findMany({
      where: { OR: [{ name: ci }, { email: ci }, ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : [])] },
      take: 5,
      select: { id: true, name: true, email: true, phone: true },
    });
    for (const u of users) {
      hits.push({
        kind: "customer",
        id: u.id,
        title: u.name,
        subtitle: [u.email, u.phone].filter(Boolean).join(" · "),
        href: `/admin/customers?q=${encodeURIComponent(u.email)}`,
      });
    }
  }

  return hits;
}
