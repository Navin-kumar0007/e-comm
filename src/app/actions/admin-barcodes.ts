"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getStaffContext } from "@/lib/auth-guard";
import { inStoreEan13, isValidEan13 } from "@/lib/barcode";

export interface BarcodeRow {
  kind: "product" | "variant";
  id: string; // product id or variant id
  productId: string;
  name: string;
  pack: string;
  sku: string | null;
  barcode: string | null;
  mrp: number | null;
  price: number;
  status: string;
}

async function guard() {
  const staff = await getStaffContext();
  if (!staff || !(staff.can("inventory.manage") || staff.can("catalog.manage"))) throw new Error("Not allowed");
  return staff;
}

/** One row per sellable unit: each pack size, or the product itself when it has no sizes. */
export async function getBarcodeRows(): Promise<BarcodeRow[]> {
  await guard();
  const products = await prisma.product.findMany({
    where: { status: { notIn: ["CUSTOM", "DELETED"] } },
    orderBy: { name: "asc" },
    include: { variants: { orderBy: [{ sortOrder: "asc" }, { price: "asc" }] } },
  });
  const rows: BarcodeRow[] = [];
  for (const p of products as any[]) {
    if (p.variants.length) {
      for (const v of p.variants) {
        rows.push({ kind: "variant", id: v.id, productId: p.id, name: p.name, pack: v.label, sku: v.sku, barcode: v.barcode, mrp: v.mrp ?? null, price: v.salePrice ?? v.price, status: p.status });
      }
    } else {
      rows.push({ kind: "product", id: p.id, productId: p.id, name: p.name, pack: p.weight || "Standard", sku: null, barcode: p.barcode, mrp: p.mrp ?? null, price: p.salePrice ?? p.price, status: p.status });
    }
  }
  return rows;
}

async function codeInUse(code: string, except: { kind: string; id: string }) {
  const [p, v] = await Promise.all([
    prisma.product.findFirst({ where: { barcode: code, ...(except.kind === "product" ? { NOT: { id: except.id } } : {}) }, select: { name: true } }),
    prisma.productVariant.findFirst({ where: { barcode: code, ...(except.kind === "variant" ? { NOT: { id: except.id } } : {}) }, select: { label: true, product: { select: { name: true } } } }),
  ]);
  return p?.name ?? (v ? `${v.product.name} ${v.label}` : null);
}

/** Save a typed / scanned barcode (e.g. a GS1 code), or clear it. */
export async function setBarcodeAction(kind: "product" | "variant", id: string, code: string | null) {
  await guard();
  const value = code?.replace(/\s+/g, "") || null;
  if (value) {
    if (!isValidEan13(value)) return { error: "Not a valid EAN-13 (13 digits with a correct check digit)." };
    const used = await codeInUse(value, { kind, id });
    if (used) return { error: `Already used by ${used}.` };
  }
  if (kind === "variant") await prisma.productVariant.update({ where: { id }, data: { barcode: value } });
  else await prisma.product.update({ where: { id }, data: { barcode: value } });
  revalidatePath("/admin/barcodes");
  return { success: true };
}

/** Gives every unit without a barcode a unique in-store EAN-13 (prefix 21). */
export async function generateMissingBarcodesAction() {
  await guard();
  const rows = (await getBarcodeRows()).filter((r) => !r.barcode);
  let created = 0;
  for (const r of rows) {
    // Running number kept in the counters table; skip any number already taken.
    for (let attempt = 0; attempt < 5; attempt++) {
      const counter = await prisma.invoiceCounter.upsert({
        where: { id: "EAN13_INSTORE" },
        create: { id: "EAN13_INSTORE", seq: 1 },
        update: { seq: { increment: 1 } },
      });
      const code = inStoreEan13(counter.seq);
      if (await codeInUse(code, { kind: "none", id: "" })) continue;
      if (r.kind === "variant") await prisma.productVariant.update({ where: { id: r.id }, data: { barcode: code } });
      else await prisma.product.update({ where: { id: r.id }, data: { barcode: code } });
      created++;
      break;
    }
  }
  revalidatePath("/admin/barcodes");
  return { created };
}
