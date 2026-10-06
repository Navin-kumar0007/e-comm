"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, History, Search, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { STOCK_REASON_LABELS, type StockReason } from "@/lib/inventory-labels";
import { adjustInventoryAction, getStockHistoryAction, updateLowStockThresholdAction } from "@/app/actions/admin-inventory";

type Variant = { id: string; label: string; stock: number; price: number; salePrice: number | null; costPrice: number | null };
type Product = {
  id: string; name: string; status: string; stock: number; price: number; salePrice: number | null; costPrice: number | null;
  weight: string | null; lowStockThreshold: number; variants: Variant[];
};
type Row = { key: string; product: Product; variant: Variant | null; label: string; stock: number; unitCost: number | null; unitPrice: number };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function InventoryClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<{ reason: StockReason; qty: string; note: string }>({ reason: "RESTOCK", qty: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Record<string, any[]>>({});

  const rows: Row[] = useMemo(
    () =>
      products.flatMap((p): Row[] =>
        p.variants.length
          ? p.variants.map((v) => ({ key: v.id, product: p, variant: v, label: v.label, stock: v.stock, unitCost: v.costPrice ?? p.costPrice, unitPrice: v.salePrice ?? v.price }))
          : [{ key: p.id, product: p, variant: null, label: p.weight || "—", stock: p.stock, unitCost: p.costPrice, unitPrice: p.salePrice ?? p.price }]
      ),
    [products]
  );

  const isLow = (r: Row) => r.stock > 0 && r.stock <= r.product.lowStockThreshold;
  const summary = {
    skus: rows.length,
    low: rows.filter(isLow).length,
    out: rows.filter((r) => r.stock <= 0).length,
    retailValue: rows.reduce((s, r) => s + Math.max(0, r.stock) * r.unitPrice, 0),
    costValue: rows.reduce((s, r) => s + Math.max(0, r.stock) * (r.unitCost ?? 0), 0),
    missingCost: rows.filter((r) => r.unitCost == null).length,
  };

  const visible = rows.filter((r) => {
    if (filter === "low" && !isLow(r)) return false;
    if (filter === "out" && r.stock > 0) return false;
    return !q || r.product.name.toLowerCase().includes(q.toLowerCase());
  });

  const toggle = async (r: Row) => {
    if (open === r.key) return setOpen(null);
    setOpen(r.key);
    setForm({ reason: "RESTOCK", qty: "", note: "" });
    if (!history[r.product.id]) {
      const h = await getStockHistoryAction(r.product.id);
      setHistory((prev) => ({ ...prev, [r.product.id]: h }));
    }
  };

  const submit = async (r: Row) => {
    const qty = Math.abs(Math.round(Number(form.qty)));
    if (!qty) return toast.error("Enter a quantity");
    const delta = form.reason === "DAMAGE" ? -qty : form.reason === "CORRECTION" ? Math.round(Number(form.qty)) : qty;
    setBusy(true);
    const res = await adjustInventoryAction({ productId: r.product.id, variantId: r.variant?.id, delta, reason: form.reason, note: form.note });
    setBusy(false);
    if ("error" in res) return toast.error(res.error);
    toast.success(`Stock is now ${res.balance}`);
    setHistory((prev) => ({ ...prev, [r.product.id]: undefined as any }));
    setOpen(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Inventory</h1>
        <p className="text-muted-foreground mt-1">Stock levels, restocks and a full history of every change</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Stock items (SKUs)", value: String(summary.skus) },
          { label: "Low stock", value: String(summary.low), tone: summary.low ? "text-amber-600" : "" },
          { label: "Out of stock", value: String(summary.out), tone: summary.out ? "text-red-600" : "" },
          { label: "Stock value (selling price)", value: inr(summary.retailValue), sub: summary.missingCost ? `At cost: ${inr(summary.costValue)} · ${summary.missingCost} without cost price` : `At cost: ${inr(summary.costValue)}` },
        ].map((c) => (
          <div key={c.label} className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${c.tone ?? ""}`}>{c.value}</p>
            {c.sub && <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          {(["all", "low", "out"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}>
              {f === "all" ? "All" : f === "low" ? `Low (${summary.low})` : `Out (${summary.out})`}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-sm" />
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Size</th>
              <th className="p-3 text-right">In stock</th>
              <th className="p-3 text-right">Alert at</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Cost</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {visible.map((r) => (
              <Fragment key={r.key}>
                <tr className="hover:bg-muted/20">
                  <td className="p-3">
                    <Link href={`/admin/products/edit/${r.product.id}`} className="font-medium hover:underline">{r.product.name}</Link>
                    {r.product.status !== "ACTIVE" && <span className="ml-2 text-[10px] uppercase text-muted-foreground">{r.product.status}</span>}
                  </td>
                  <td className="p-3 text-muted-foreground">{r.label}</td>
                  <td className={`p-3 text-right font-semibold tabular-nums ${r.stock <= 0 ? "text-red-600" : isLow(r) ? "text-amber-600" : ""}`}>{r.stock}</td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min={0}
                      defaultValue={r.product.lowStockThreshold}
                      onBlur={async (e) => {
                        const v = Number(e.target.value);
                        if (v !== r.product.lowStockThreshold) {
                          await updateLowStockThresholdAction(r.product.id, v);
                          router.refresh();
                        }
                      }}
                      className="w-16 h-8 px-2 rounded-lg border border-input bg-background text-right"
                      aria-label="Low stock alert level"
                    />
                  </td>
                  <td className="p-3 text-right tabular-nums">₹{r.unitPrice}</td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">{r.unitCost != null ? `₹${r.unitCost}` : "—"}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => toggle(r)}>
                      <PackagePlus className="w-4 h-4 mr-1" /> Adjust
                    </Button>
                  </td>
                </tr>
                {open === r.key && (
                  <tr className="bg-muted/10">
                    <td colSpan={7} className="p-4 space-y-4">
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">Type</span>
                          <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value as StockReason })} className="h-9 px-2 rounded-lg border border-input bg-background">
                            <option value="RESTOCK">Restock (received from supplier)</option>
                            <option value="DAMAGE">Damaged / expired (remove)</option>
                            <option value="CORRECTION">Correction (+ or −)</option>
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">Quantity{form.reason === "CORRECTION" ? " (use − to reduce)" : ""}</span>
                          <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="w-28 h-9 px-2 rounded-lg border border-input bg-background" />
                        </label>
                        <label className="space-y-1 flex-1 min-w-[180px]">
                          <span className="text-xs text-muted-foreground">Note (supplier, invoice, batch…)</span>
                          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full h-9 px-2 rounded-lg border border-input bg-background" />
                        </label>
                        <Button size="sm" onClick={() => submit(r)} disabled={busy}>
                          {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save
                        </Button>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2"><History className="w-3 h-3" /> Recent changes ({r.product.name})</p>
                        {!history[r.product.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : history[r.product.id].length === 0 ? (
                          <p className="text-xs text-muted-foreground">No recorded changes yet — history starts from now.</p>
                        ) : (
                          <ul className="space-y-1 max-h-64 overflow-y-auto text-xs">
                            {history[r.product.id].map((m: any) => (
                              <li key={m.id} className="flex flex-wrap gap-x-3">
                                <span className="text-muted-foreground w-32">{new Date(m.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                <span className={`w-12 text-right font-semibold tabular-nums ${m.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
                                <span className="w-20">{m.size ?? ""}</span>
                                <span>{STOCK_REASON_LABELS[m.reason as StockReason] ?? m.reason}</span>
                                {m.orderId && <Link href={`/admin/orders/${m.orderId}`} className="text-primary hover:underline">#{m.orderId.slice(-8).toUpperCase()}</Link>}
                                {m.note && <span className="text-muted-foreground">· {m.note}</span>}
                                <span className="text-muted-foreground">→ {m.balanceAfter} · {m.actor}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nothing here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
