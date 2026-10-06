"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveProductVariantsAction } from "@/app/actions/admin-products";

type Row = { id?: string; label: string; price: string; salePrice: string; mrp: string; costPrice: string; stock: string; sku: string };

const cell = "w-full h-9 px-2 rounded-lg border border-input bg-background text-sm";
const toRow = (v: any): Row => ({
  id: v.id,
  label: v.label,
  price: String(v.price ?? ""),
  salePrice: v.salePrice ? String(v.salePrice) : "",
  mrp: v.mrp ? String(v.mrp) : "",
  costPrice: v.costPrice ? String(v.costPrice) : "",
  stock: String(v.stock ?? 0),
  sku: v.sku ?? "",
});

export function VariantsEditor({ productId, variants }: { productId: string; variants: any[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(variants.map(toRow));
  const [saving, setSaving] = useState(false);

  const update = (i: number, key: keyof Row, value: string) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [key]: value } : row)));

  const save = async () => {
    setSaving(true);
    const res = await saveProductVariantsAction(
      productId,
      rows.map((r) => ({
        id: r.id,
        label: r.label,
        price: Number(r.price),
        salePrice: r.salePrice ? Number(r.salePrice) : null,
        mrp: r.mrp ? Number(r.mrp) : null,
        costPrice: r.costPrice ? Number(r.costPrice) : null,
        stock: Number(r.stock) || 0,
        sku: r.sku || null,
      }))
    );
    setSaving(false);
    if ("error" in res) return toast.error(res.error);
    toast.success("Sizes saved");
    router.refresh();
  };

  return (
    <div className="max-w-[1600px] mx-auto mt-6 p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4">
      <div>
        <h2 className="font-heading font-bold text-lg">Pack Sizes</h2>
        <p className="text-sm text-muted-foreground">
          Optional. Add sizes like 100g / 250g / 500g, each with its own price and stock. The first size is the default shown in the shop.
          {rows.length === 0 && " Leave empty to sell a single size using the price and stock above."}
        </p>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="p-1">Size label *</th>
                <th className="p-1">Price ₹ *</th>
                <th className="p-1">Sale ₹</th>
                <th className="p-1">MRP ₹</th>
                <th className="p-1">Cost ₹</th>
                <th className="p-1">Stock</th>
                <th className="p-1">SKU</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id ?? `new-${i}`}>
                  <td className="p-1"><input value={r.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="250g" className={cell} /></td>
                  <td className="p-1"><input type="number" step="0.01" value={r.price} onChange={(e) => update(i, "price", e.target.value)} className={cell} /></td>
                  <td className="p-1"><input type="number" step="0.01" value={r.salePrice} onChange={(e) => update(i, "salePrice", e.target.value)} className={cell} /></td>
                  <td className="p-1"><input type="number" step="0.01" value={r.mrp} onChange={(e) => update(i, "mrp", e.target.value)} className={cell} /></td>
                  <td className="p-1"><input type="number" step="0.01" value={r.costPrice} onChange={(e) => update(i, "costPrice", e.target.value)} className={cell} /></td>
                  <td className="p-1"><input type="number" min={0} value={r.stock} onChange={(e) => update(i, "stock", e.target.value)} className={cell} /></td>
                  <td className="p-1"><input value={r.sku} onChange={(e) => update(i, "sku", e.target.value)} className={cell} /></td>
                  <td className="p-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="Remove size">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, { label: "", price: "", salePrice: "", mrp: "", costPrice: "", stock: "0", sku: "" }])}>
          <Plus className="w-4 h-4 mr-1" /> Add size
        </Button>
        {(rows.length > 0 || variants.length > 0) && (
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save sizes
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Stock changes here are recorded in the inventory history as corrections. For deliveries from suppliers, use Inventory → Restock.</p>
    </div>
  );
}
