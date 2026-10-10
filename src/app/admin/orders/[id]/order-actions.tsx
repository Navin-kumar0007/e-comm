"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, MessageCircle, Pencil, ShieldAlert, Check, X, Plus, Trash2, Store, Globe, Building2, PhoneCall } from "lucide-react";
import {
  cancelUnconfirmedCodAction, confirmCodAction, editOrderContactAction, editOrderItemsAction, getOrderEditCatalog, type OrderContactInput,
} from "@/app/actions/admin-orders";
import { SidePanel, Field, inputCls, btnPrimary, btnSecondary } from "@/components/admin/ui";

const CHANNEL: Record<string, { label: string; icon: typeof Globe; cls: string }> = {
  WEBSITE: { label: "Website", icon: Globe, cls: "bg-blue-50 text-blue-700" },
  SHOP: { label: "Shop counter", icon: Store, cls: "bg-emerald-50 text-emerald-700" },
  WHOLESALE: { label: "Wholesale", icon: Building2, cls: "bg-amber-50 text-amber-800" },
  PHONE: { label: "Phone order", icon: PhoneCall, cls: "bg-purple-50 text-purple-700" },
};

/** Parses "street, city, state, pincode" (how addresses are stored) back into fields. */
function splitAddress(a: string, state?: string | null) {
  const parts = a.split(",").map((p) => p.trim()).filter(Boolean);
  const pincode = /^\d{6}$/.test(parts[parts.length - 1] ?? "") ? parts.pop()! : "";
  const st = state || parts.pop() || "";
  if (state && parts[parts.length - 1] === state) parts.pop();
  const city = parts.pop() || "";
  return { address: parts.join(", "), city, state: st, pincode };
}

export function OrderActions({ order }: { order: any }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [contact, setContact] = useState<OrderContactInput | null>(null);
  const [items, setItems] = useState<Array<{ productId: string; variantId: string | null; label: string; quantity: number; price: number }> | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [pick, setPick] = useState("");

  const ch = CHANNEL[order.channel ?? "WEBSITE"] ?? CHANNEL.WEBSITE;
  const phone10 = (order.customerPhone || "").replace(/\D/g, "").slice(-10);
  const editable = ["PENDING", "PROCESSING", "CONFIRMED"].includes(order.status) && !(order.shipments ?? []).some((s: any) => s.status !== "CANCELLED");
  const prepaid = order.paymentMethod === "ONLINE" && order.paymentId;

  const run = (fn: () => Promise<any>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (res && "error" in res && res.error) { toast.error(res.error); return; }
      toast.success(ok);
      setContact(null);
      setItems(null);
      router.refresh();
    });

  const openItems = () =>
    start(async () => {
      setCatalog(await getOrderEditCatalog());
      setItems(order.items.map((i: any) => ({ productId: i.productId, variantId: i.variantId ?? null, label: `${i.productName} · ${i.weight}`, quantity: i.quantity, price: i.price })));
    });

  const newTotal = items ? items.reduce((s, i) => s + i.price * i.quantity, 0) - Math.min(order.discount || 0, items.reduce((s, i) => s + i.price * i.quantity, 0)) + (order.shippingFee || 0) : 0;

  return (
    <div className="space-y-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ch.cls}`}><ch.icon className="h-3.5 w-3.5" />{ch.label}</span>
        {phone10 && (<>
          <a href={`tel:+91${phone10}`} className={btnSecondary}><Phone className="h-4 w-4" /> Call</a>
          <a href={`https://wa.me/91${phone10}`} target="_blank" rel="noreferrer" className={btnSecondary}><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        </>)}
        {editable && (<>
          <button className={btnSecondary} onClick={() => setContact({ customerName: order.customerName, customerPhone: phone10, customerEmail: order.customerEmail, customerGstin: order.customerGstin ?? "", ...splitAddress(order.shippingAddress, order.shippingState) })}><Pencil className="h-4 w-4" /> Edit address</button>
          {!prepaid && <button className={btnSecondary} disabled={pending} onClick={openItems}><Pencil className="h-4 w-4" /> Edit items</button>}
        </>)}
      </div>

      {order.codStatus === "PENDING" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 shrink-0" /> Waiting for the customer to confirm this COD order on WhatsApp. It won’t be booked with the courier until confirmed.</span>
          <span className="flex gap-2">
            <button className={btnPrimary} disabled={pending} onClick={() => run(() => confirmCodAction(order.id), "COD order confirmed")}><Check className="h-4 w-4" /> Confirmed by phone</button>
            <button className={`${btnSecondary} text-red-700`} disabled={pending} onClick={() => run(() => cancelUnconfirmedCodAction(order.id), "Order cancelled and stock returned")}><X className="h-4 w-4" /> Cancel order</button>
          </span>
        </div>
      )}
      {order.codStatus === "CONFIRMED" && <p className="text-xs font-medium text-emerald-700">✓ COD confirmed by the customer{order.codConfirmedAt ? ` on ${new Date(order.codConfirmedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}</p>}

      <SidePanel open={!!contact} onOpenChange={(o) => !o && setContact(null)} title="Edit customer and address" description="Changes print on the shipping label and invoice."
        footer={<><button className={btnSecondary} onClick={() => setContact(null)}>Cancel</button><button className={btnPrimary} disabled={pending} onClick={() => run(() => editOrderContactAction(order.id, contact!), "Order updated")}>Save</button></>}>
        {contact && (
          <div className="space-y-3">
            <Field label="Name"><input className={inputCls} value={contact.customerName} onChange={(e) => setContact({ ...contact, customerName: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"><input className={inputCls} inputMode="tel" value={contact.customerPhone} onChange={(e) => setContact({ ...contact, customerPhone: e.target.value })} /></Field>
              <Field label="Email"><input className={inputCls} type="email" value={contact.customerEmail} onChange={(e) => setContact({ ...contact, customerEmail: e.target.value })} /></Field>
            </div>
            <Field label="Address (house, street, area)"><textarea className={`${inputCls} h-16 py-2`} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="City"><input className={inputCls} value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} /></Field>
              <Field label="State"><input className={inputCls} value={contact.state} onChange={(e) => setContact({ ...contact, state: e.target.value })} /></Field>
              <Field label="Pincode"><input className={inputCls} inputMode="numeric" maxLength={6} value={contact.pincode} onChange={(e) => setContact({ ...contact, pincode: e.target.value.replace(/\D/g, "") })} /></Field>
            </div>
            <Field label="Buyer GSTIN (optional)"><input className={`${inputCls} font-mono uppercase`} maxLength={15} value={contact.customerGstin ?? ""} onChange={(e) => setContact({ ...contact, customerGstin: e.target.value.toUpperCase() })} /></Field>
          </div>
        )}
      </SidePanel>

      <SidePanel wide open={!!items} onOpenChange={(o) => !o && setItems(null)} title="Edit items" description="Stock moves by the difference. Prices already on the order stay as quoted; new items use today's price."
        footer={<><span className="mr-auto text-sm">New total <b className="tabular-nums">₹{newTotal.toFixed(2)}</b> <span className="text-muted-foreground">(was ₹{order.total.toFixed(2)})</span></span><button className={btnSecondary} onClick={() => setItems(null)}>Cancel</button><button className={btnPrimary} disabled={pending || !items?.length} onClick={() => run(() => editOrderItemsAction(order.id, items!.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity }))), "Items updated")}>Save</button></>}>
        {items && (
          <div className="space-y-3">
            <ul className="divide-y divide-border/60 rounded-xl border border-border">
              {items.map((i, k) => (
                <li key={k} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{i.label} <span className="text-muted-foreground">· ₹{i.price}</span></span>
                  <input aria-label="Quantity" type="number" min={1} className="h-8 w-16 rounded-lg border border-border px-2 text-center" value={i.quantity} onChange={(e) => setItems(items.map((x, j) => (j === k ? { ...x, quantity: Math.max(1, parseInt(e.target.value) || 1) } : x)))} />
                  <button aria-label="Remove" className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700" onClick={() => setItems(items.filter((_, j) => j !== k))}><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <select className={inputCls} value={pick} onChange={(e) => setPick(e.target.value)}>
                <option value="">Add a product…</option>
                {catalog.map((c, k) => <option key={k} value={k}>{c.label} · ₹{c.price} · {c.stock} in stock</option>)}
              </select>
              <button className={btnSecondary} disabled={pick === ""} onClick={() => { const c = catalog[Number(pick)]; if (!c) return; const at = items.findIndex((x) => x.productId === c.productId && x.variantId === c.variantId); setItems(at >= 0 ? items.map((x, j) => (j === at ? { ...x, quantity: x.quantity + 1 } : x)) : [...items, { productId: c.productId, variantId: c.variantId, label: c.label, quantity: 1, price: c.price }]); setPick(""); }}><Plus className="h-4 w-4" /> Add</button>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
