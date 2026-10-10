"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  ScanBarcode, Camera, CameraOff, Search, Minus, Plus, Trash2, Banknote, Smartphone, CreditCard, CheckCircle2, MessageCircle, Mail, Printer, FileText, RotateCcw, Store,
} from "lucide-react";
import { createCounterSaleAction, getCounterDay, sendBillAction, type PosItem } from "@/app/actions/admin-pos";
import { PageHeader, Panel, Stat, Field, inputCls, btnPrimary, btnSecondary, btnGhost, thCls, tdCls, inr } from "@/components/admin/ui";

const CameraScanner = dynamic(() => import("@/components/admin/camera-scanner").then((m) => m.CameraScanner), { ssr: false });

type Line = { item: PosItem; qty: number };
type Method = "CASH" | "UPI" | "CARD";
const r2 = (n: number) => Math.round(n * 100) / 100;
const time = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export function PosClient({ data, today: initialToday }: { data: { items: PosItem[]; buyers: any[]; upiId: string | null; shopName: string }; today: any }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"bill" | "today">("bill");
  const [scan, setScan] = useState("");
  const [camera, setCamera] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [buyerId, setBuyerId] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", gstin: "" });
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<Method>("CASH");
  const [cash, setCash] = useState<string>("");
  const [ref, setRef] = useState("");
  const [done, setDone] = useState<null | { id: string; invoiceNumber: string; total: number; change: number | null; phone: string; email: string | null; billUrl: string }>(null);
  const [sendTo, setSendTo] = useState({ phone: "", email: "" });
  const [today, setToday] = useState(initialToday);
  const scanRef = useRef<HTMLInputElement>(null);

  const byCode = useMemo(() => {
    const m = new Map<string, PosItem>();
    for (const i of data.items) {
      if (i.barcode) m.set(i.barcode, i);
      if (i.sku) m.set(i.sku.toUpperCase(), i);
    }
    return m;
  }, [data.items]);
  const buyer = data.buyers.find((b) => b.id === buyerId) ?? null;
  const pct = buyer?.wholesaleDiscount ?? 0;
  const priceOf = (i: PosItem) => r2(i.price * (1 - pct / 100));
  const subtotal = r2(lines.reduce((s, l) => s + priceOf(l.item) * l.qty, 0));
  const disc = Math.max(0, Math.min(subtotal, Number(discount) || 0));
  const total = r2(subtotal - disc);
  const units = lines.reduce((s, l) => s + l.qty, 0);
  const change = method === "CASH" && Number(cash) ? r2(Number(cash) - total) : null;
  const matches = scan.trim().length >= 2 && !/^\d{6,}$/.test(scan.trim())
    ? data.items.filter((i) => `${i.name} ${i.pack} ${i.sku ?? ""}`.toLowerCase().includes(scan.trim().toLowerCase())).slice(0, 8)
    : [];

  const focusScan = () => setTimeout(() => scanRef.current?.focus(), 0);
  useEffect(() => { if (tab === "bill" && !done) focusScan(); }, [tab, done]);

  const add = (item: PosItem, qty = 1) => {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.item.key === item.key);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, qty: l.qty + qty } : l));
      return [{ item, qty }, ...ls];
    });
    if (item.stock <= 0) toast.warning(`${item.name} ${item.pack}: system shows no stock. Check the shelf count.`);
  };

  const onCode = (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const item = byCode.get(code) ?? byCode.get(code.toUpperCase());
    if (item) {
      add(item);
      toast.success(`${item.name} ${item.pack}`, { duration: 900 });
    } else if (/^B\d{4}-\d{3}$/i.test(code)) {
      toast.error("That's a batch sticker. Scan the product barcode instead.");
    } else {
      toast.error(`No product with barcode ${code}`);
    }
  };

  const onScanEnter = () => {
    const v = scan.trim();
    if (!v) return;
    if (byCode.has(v) || byCode.has(v.toUpperCase()) || /^\d{8,14}$/.test(v)) onCode(v);
    else if (matches.length === 1) add(matches[0]);
    else return; // let them pick from the list
    setScan("");
  };

  const reset = () => {
    setLines([]); setBuyerId(""); setCustomer({ name: "", phone: "", email: "", gstin: "" }); setDiscount(0); setMethod("CASH"); setCash(""); setRef(""); setDone(null); setSendTo({ phone: "", email: "" });
    focusScan();
  };

  const complete = () =>
    start(async () => {
      const res = await createCounterSaleAction({
        lines: lines.map((l) => ({ productId: l.item.productId, variantId: l.item.variantId, qty: l.qty })),
        discount: disc, buyerId: buyerId || null, customer,
        payment: { method, cashReceived: method === "CASH" && cash ? Number(cash) : null, ref: ref || null },
      });
      if ("error" in res) { toast.error(res.error); return; }
      setDone(res);
      setSendTo({ phone: res.phone ? res.phone.slice(-10) : "", email: res.email ?? "" });
      setToday(await getCounterDay());
      router.refresh();
    });

  const send = (via: "whatsapp" | "email") =>
    start(async () => {
      const res = await sendBillAction(done!.id, via, via === "whatsapp" ? sendTo.phone : sendTo.email);
      if ("error" in res) { toast.error(res.error); return; }
      toast.success(via === "whatsapp" ? "Bill sent on WhatsApp" : "Bill emailed");
    });

  const upiLink = data.upiId ? `upi://pay?pa=${encodeURIComponent(data.upiId)}&pn=${encodeURIComponent(data.shopName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent("Spicy Nuts bill")}` : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Counter billing"
        subtitle="Scan, take payment, and give a GST bill. Shop sales use the same stock, invoices and reports as online orders."
        actions={<div className="flex rounded-lg bg-white p-0.5 ring-1 ring-border">
          {(["bill", "today"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3.5 py-1.5 text-sm font-semibold ${tab === t ? "bg-[#6E1A2C] text-white" : "text-muted-foreground"}`}>{t === "bill" ? "New bill" : `Today · ${inr(today.totals.all)}`}</button>
          ))}
        </div>}
      />

      {tab === "today" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Bills" value={today.totals.bills} hint={`${today.totals.units} packs`} />
            <Stat label="Cash" value={inr(today.totals.cash)} hint="Should be in the drawer" />
            <Stat label="UPI" value={inr(today.totals.upi)} />
            <Stat label="Card" value={inr(today.totals.card)} />
            <Stat label="Total" value={inr(today.totals.all)} tone="good" />
          </div>
          <Panel title={`Shop sales on ${today.date}`} action={<button className={btnSecondary} onClick={() => window.print()}><Printer className="h-4 w-4" /> Print day summary</button>}>
            {today.orders.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No counter sales yet today.</p> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30"><tr><th className={thCls}>Time</th><th className={thCls}>Bill</th><th className={thCls}>Customer</th><th className={thCls}>Paid by</th><th className={`${thCls} text-right`}>Amount</th><th className={thCls}></th></tr></thead>
                <tbody className="divide-y divide-border/60">
                  {today.orders.map((o: any) => (
                    <tr key={o.id} className={o.status !== "DELIVERED" ? "opacity-50 line-through" : ""}>
                      <td className={tdCls}>{time(o.createdAt)}</td>
                      <td className={`${tdCls} font-mono text-xs`}>{o.invoiceNumber}</td>
                      <td className={tdCls}>{o.customerName}{o.customerPhone ? <span className="text-xs text-muted-foreground"> · {o.customerPhone.slice(-10)}</span> : null}</td>
                      <td className={tdCls}>{o.paymentMethod}{o.paymentRef ? <span className="text-xs text-muted-foreground"> · {o.paymentRef}</span> : null}</td>
                      <td className={`${tdCls} text-right font-semibold tabular-nums`}>{inr(o.total, 2)}</td>
                      <td className={`${tdCls} text-right print:hidden`}>
                        <a className={btnGhost} href={`/admin/pos/receipt/${o.id}`} target="_blank" rel="noreferrer"><Printer className="h-3.5 w-3.5" /> Receipt</a>
                        <a className={btnGhost} href={`/admin/orders/${o.id}`}>Open</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
          <p className="text-xs text-muted-foreground print:hidden">To take back a sale, open it and use Return / Refund, so stock and GST are corrected.</p>
        </div>
      ) : done ? (
        <Panel className="mx-auto max-w-xl">
          <div className="space-y-5 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <div>
              <p className="text-sm text-muted-foreground">Bill {done.invoiceNumber}</p>
              <p className="text-3xl font-bold tabular-nums text-[#2a0a12]">{inr(done.total, 2)}</p>
              {done.change !== null && <p className="mt-1 text-lg font-semibold text-emerald-700">Give change: {inr(done.change, 2)}</p>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a href={`/admin/pos/receipt/${done.id}`} target="_blank" rel="noreferrer" className={btnPrimary}><Printer className="h-4 w-4" /> Print receipt (80 mm)</a>
              <a href={done.billUrl} target="_blank" rel="noreferrer" className={btnSecondary}><FileText className="h-4 w-4" /> A4 GST invoice</a>
            </div>
            <div className="space-y-2 rounded-xl border border-border p-3 text-left">
              <p className="text-xs font-semibold text-muted-foreground">Send the bill</p>
              <div className="flex gap-2">
                <input className={inputCls} inputMode="tel" placeholder="WhatsApp number" value={sendTo.phone} onChange={(e) => setSendTo({ ...sendTo, phone: e.target.value })} />
                <button className={`${btnSecondary} shrink-0`} disabled={pending} onClick={() => send("whatsapp")}><MessageCircle className="h-4 w-4" /> WhatsApp</button>
              </div>
              <div className="flex gap-2">
                <input className={inputCls} type="email" placeholder="Email" value={sendTo.email} onChange={(e) => setSendTo({ ...sendTo, email: e.target.value })} />
                <button className={`${btnSecondary} shrink-0`} disabled={pending} onClick={() => send("email")}><Mail className="h-4 w-4" /> Email</button>
              </div>
            </div>
            <button className={`${btnPrimary} w-full`} onClick={reset}><RotateCcw className="h-4 w-4" /> New bill</button>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-3">
            <Panel>
              <div className="space-y-3 p-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6E1A2C]" />
                    <input
                      ref={scanRef}
                      value={scan}
                      onChange={(e) => setScan(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onScanEnter(); } }}
                      placeholder="Scan a barcode, or type a product name"
                      aria-label="Scan or search"
                      autoComplete="off"
                      className="h-12 w-full rounded-xl border-2 border-[#6E1A2C]/30 bg-white pl-11 pr-3 text-base outline-none focus:border-[#6E1A2C]"
                    />
                  </div>
                  <button className={`${btnSecondary} h-12`} onClick={() => setCamera((c) => !c)} aria-pressed={camera}>
                    {camera ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}<span className="hidden sm:inline">{camera ? "Stop camera" : "Camera"}</span>
                  </button>
                </div>
                {camera && <CameraScanner onCode={onCode} />}
                {matches.length > 0 && (
                  <ul className="divide-y divide-border/60 rounded-xl border border-border">
                    {matches.map((m) => (
                      <li key={m.key}>
                        <button className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/40" onClick={() => { add(m); setScan(""); focusScan(); }}>
                          <span><b>{m.name}</b> · {m.pack} <span className="text-xs text-muted-foreground">{m.stock} in stock</span></span>
                          <span className="tabular-nums">{inr(priceOf(m), 2)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-muted-foreground">USB and Bluetooth scanners work here directly: click this box once, then scan.</p>
              </div>
            </Panel>

            <Panel title={`Bill · ${units} item${units === 1 ? "" : "s"}`} action={lines.length ? <button className={btnGhost} onClick={() => setLines([])}><Trash2 className="h-3.5 w-3.5" /> Clear</button> : undefined}>
              {lines.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground"><Store className="h-8 w-8 text-[#c9a45a]" />Scan the first pack to start a bill.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {lines.map((l) => (
                    <li key={l.item.key} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{l.item.name} <span className="font-normal text-muted-foreground">· {l.item.pack}</span></p>
                        <p className="text-xs text-muted-foreground tabular-nums">{inr(priceOf(l.item), 2)} each{l.item.mrp && l.item.mrp > priceOf(l.item) ? <span className="ml-1 line-through">MRP {inr(l.item.mrp)}</span> : null}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button aria-label="One less" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border" onClick={() => setLines((ls) => ls.flatMap((x) => (x.item.key !== l.item.key ? [x] : x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : [])))}><Minus className="h-3.5 w-3.5" /></button>
                        <input aria-label="Quantity" className="h-8 w-12 rounded-lg border border-border text-center tabular-nums" inputMode="numeric" value={l.qty} onChange={(e) => { const q = Math.max(1, Math.min(999, parseInt(e.target.value) || 1)); setLines((ls) => ls.map((x) => (x.item.key === l.item.key ? { ...x, qty: q } : x))); }} />
                        <button aria-label="One more" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border" onClick={() => add(l.item)}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <p className="w-24 text-right font-semibold tabular-nums">{inr(priceOf(l.item) * l.qty, 2)}</p>
                      <button aria-label="Remove" className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700" onClick={() => setLines((ls) => ls.filter((x) => x.item.key !== l.item.key))}><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="space-y-4 xl:col-span-2">
            <Panel title="Customer (optional)">
              <div className="space-y-3 p-4">
                {data.buyers.length > 0 && (
                  <Field label="Wholesale buyer">
                    <select className={inputCls} value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
                      <option value="">Walk-in customer</option>
                      {data.buyers.map((b) => <option key={b.id} value={b.id}>{b.businessName || b.name}{b.wholesaleDiscount ? ` · ${b.wholesaleDiscount}% off` : ""}</option>)}
                    </select>
                  </Field>
                )}
                {!buyer && (
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} placeholder="Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                    <input className={inputCls} inputMode="tel" placeholder="Phone (to send bill)" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                    <input className={`${inputCls} col-span-2 font-mono uppercase`} maxLength={15} placeholder="GSTIN (business buyers)" value={customer.gstin} onChange={(e) => setCustomer({ ...customer, gstin: e.target.value.toUpperCase() })} />
                  </div>
                )}
              </div>
            </Panel>

            <Panel title="Payment">
              <div className="space-y-4 p-4">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Items{pct ? ` (${pct}% wholesale price)` : ""}</dt><dd className="tabular-nums">{inr(subtotal, 2)}</dd></div>
                  <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Discount ₹</dt><dd><input type="number" min={0} step={1} className="h-8 w-24 rounded-lg border border-border px-2 text-right tabular-nums" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} /></dd></div>
                  <div className="flex justify-between border-t border-border pt-2 text-2xl font-bold text-[#2a0a12]"><dt>Total</dt><dd className="tabular-nums">{inr(total, 2)}</dd></div>
                  <p className="text-right text-[11px] text-muted-foreground">GST included</p>
                </dl>
                <div className="grid grid-cols-3 gap-2">
                  {([["CASH", "Cash", Banknote], ["UPI", "UPI", Smartphone], ["CARD", "Card", CreditCard]] as const).map(([m, label, Icon]) => (
                    <button key={m} onClick={() => setMethod(m)} className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-sm font-semibold ${method === m ? "border-[#6E1A2C] bg-[#6E1A2C]/5 text-[#6E1A2C]" : "border-border text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />{label}
                    </button>
                  ))}
                </div>
                {method === "CASH" && (
                  <div className="space-y-2">
                    <Field label="Cash received ₹"><input type="number" min={0} className={`${inputCls} h-11 text-lg tabular-nums`} value={cash} onChange={(e) => setCash(e.target.value)} placeholder={total ? String(Math.ceil(total)) : ""} /></Field>
                    <div className="flex flex-wrap gap-1.5">
                      {[Math.ceil(total), 100, 200, 500, 2000].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4).map((v) => <button key={v} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold tabular-nums hover:bg-muted" onClick={() => setCash(String(v))}>{inr(v)}</button>)}
                    </div>
                    {change !== null && <p className={`text-lg font-bold ${change < 0 ? "text-red-700" : "text-emerald-700"}`}>{change < 0 ? `Short by ${inr(-change, 2)}` : `Change: ${inr(change, 2)}`}</p>}
                  </div>
                )}
                {method === "UPI" && (
                  upiLink && total > 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-3">
                      <QRCode value={upiLink} size={168} />
                      <p className="text-center text-xs text-muted-foreground">Customer scans to pay {inr(total, 2)} to {data.upiId}. Check the payment on your phone before completing.</p>
                      <input className={inputCls} placeholder="UPI reference (optional)" value={ref} onChange={(e) => setRef(e.target.value)} />
                    </div>
                  ) : (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{upiLink ? "Add items first." : "Add your UPI ID in Admin → Settings to show a payment QR with the exact amount."}</p>
                  )
                )}
                {method === "CARD" && <input className={inputCls} placeholder="Card slip / approval number (optional)" value={ref} onChange={(e) => setRef(e.target.value)} />}
                <button className={`${btnPrimary} h-12 w-full text-base`} disabled={pending || !lines.length || (method === "CASH" && change !== null && change < 0)} onClick={complete}>
                  {pending ? "Saving…" : `Complete sale · ${inr(total, 2)}`}
                </button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
