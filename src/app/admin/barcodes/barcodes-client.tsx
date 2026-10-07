"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wand2, Printer, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { generateMissingBarcodesAction, setBarcodeAction, type BarcodeRow } from "@/app/actions/admin-barcodes";
import { isInStoreCode, isValidEan13, formatEan13 } from "@/lib/barcode";

export function BarcodesClient({ rows }: { rows: BarcodeRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [copies, setCopies] = useState<Record<string, number>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [size, setSize] = useState<"50x25" | "a4">("50x25");
  const [pending, start] = useTransition();

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => `${r.name} ${r.pack} ${r.sku ?? ""} ${r.barcode ?? ""}`.toLowerCase().includes(s)) : rows;
  }, [rows, q]);
  const missing = rows.filter((r) => !r.barcode).length;
  const inStore = rows.filter((r) => r.barcode && isInStoreCode(r.barcode)).length;
  const gs1 = rows.filter((r) => r.barcode && !isInStoreCode(r.barcode)).length;
  const chosen = Object.entries(copies).filter(([, n]) => n > 0);

  const generate = () =>
    start(async () => {
      const res = await generateMissingBarcodesAction();
      toast.success(`Created ${res.created} in-store barcode${res.created === 1 ? "" : "s"}`);
      router.refresh();
    });

  const save = (r: BarcodeRow) =>
    start(async () => {
      const res = await setBarcodeAction(r.kind, r.id, edits[r.id] ?? "");
      if ("error" in res && res.error) { toast.error(res.error); return; }
      toast.success(`Saved barcode for ${r.name} ${r.pack}`);
      setEdits((e) => { const n = { ...e }; delete n[r.id]; return n; });
      router.refresh();
    });

  const printHref = `/admin/barcodes/print?size=${size}&items=${chosen.map(([id, n]) => `${id}:${n}`).join(",")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Barcodes</h1>
          <p className="text-sm text-muted-foreground">EAN-13 for every product and pack size. Print stickers for jars, shelves and scanners.</p>
        </div>
        <button onClick={generate} disabled={!missing || pending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#6E1A2C] px-4 text-sm font-semibold text-white disabled:opacity-40">
          <Wand2 className="h-4 w-4" /> Generate {missing || ""} missing
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Missing a barcode", value: missing, tone: missing ? "text-amber-700" : "" },
          { label: "In-store codes (21…)", value: inStore, tone: "" },
          { label: "GS1 codes (890…)", value: gs1, tone: "" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <p className="rounded-lg border border-[#c9a45a]/40 bg-[#fbf6ee] px-4 py-3 text-sm text-[#5a4a32]">
        In-store codes (starting 21) scan fine in your shop but are not accepted by retail chains or marketplaces. When you get GS1 India codes (starting 890), type or scan them into the box and save.
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3">
        <div className="flex h-9 flex-1 min-w-[200px] items-center gap-2 rounded-lg border border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find product, SKU or barcode" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <select value={size} onChange={(e) => setSize(e.target.value as "50x25" | "a4")} className="h-9 rounded-lg border border-border bg-white px-2 text-sm">
          <option value="50x25">50 × 25 mm thermal roll</option>
          <option value="a4">A4 sheet · 65 stickers</option>
        </select>
        <a href={chosen.length ? printHref : undefined} target="_blank" rel="noreferrer" aria-disabled={!chosen.length}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium ${chosen.length ? "border-border hover:bg-muted" : "pointer-events-none border-border/50 text-muted-foreground/50"}`}>
          <Printer className="h-4 w-4" /> Print {chosen.reduce((s, [, n]) => s + n, 0) || ""} stickers
        </a>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-2 py-3">Pack</th>
              <th className="px-2 py-3">Barcode (EAN-13)</th>
              <th className="px-2 py-3 w-28">Stickers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((r) => {
              const draft = edits[r.id];
              const value = draft ?? r.barcode ?? "";
              const valid = !value || isValidEan13(value);
              return (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{r.name}</p>
                    {r.sku && <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>}
                  </td>
                  <td className="px-2 py-2.5">{r.pack}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        value={value}
                        inputMode="numeric"
                        maxLength={13}
                        onChange={(e) => setEdits((x) => ({ ...x, [r.id]: e.target.value.replace(/\D/g, "") }))}
                        placeholder="Not set"
                        aria-label={`Barcode for ${r.name} ${r.pack}`}
                        className={`h-9 w-40 rounded-lg border px-2 font-mono text-sm ${valid ? "border-border" : "border-red-400 bg-red-50"}`}
                      />
                      {draft !== undefined && draft !== (r.barcode ?? "") ? (
                        <button onClick={() => save(r)} disabled={!valid || pending} className="h-9 rounded-lg bg-[#6E1A2C] px-3 text-xs font-semibold text-white disabled:opacity-40">Save</button>
                      ) : r.barcode && !isValidEan13(r.barcode) ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-700"><AlertCircle className="h-3.5 w-3.5" /> Invalid</span>
                      ) : r.barcode ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={formatEan13(r.barcode)}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {isInStoreCode(r.barcode) ? "In-store" : "GS1"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertCircle className="h-3.5 w-3.5" /> Missing</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <input type="number" min={0} max={500} value={copies[r.id] ?? 0} disabled={!r.barcode}
                      onChange={(e) => setCopies((c) => ({ ...c, [r.id]: Math.max(0, Math.min(500, Number(e.target.value) || 0)) }))}
                      aria-label={`Sticker copies for ${r.name} ${r.pack}`}
                      className="h-9 w-20 rounded-lg border border-border px-2 text-sm disabled:opacity-40" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
