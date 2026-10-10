"use client";

import Barcode from "@/components/ui/barcode";
import { PrintToolbar } from "../../print/print-docs";

export interface BatchSticker {
  name: string;
  pack: string;
  mrp: number | null;
  lotNumber: string;
  mfgDate: string | null;
  expiryDate: string | null;
  barcode: string | null;
  copies: number;
}

// Packaged-food labels in India show month and year: "PKD 10/2026", "BB 04/2027".
const my = (d: string | null) => {
  if (!d) return "—";
  const ist = new Date(new Date(d).getTime() + 5.5 * 36e5);
  return `${String(ist.getUTCMonth() + 1).padStart(2, "0")}/${ist.getUTCFullYear()}`;
};

function Sticker({ s, a4, fssai }: { s: BatchSticker; a4: boolean; fssai: string | null }) {
  return (
    <div
      className="sticker flex flex-col justify-between overflow-hidden bg-white px-1.5 py-1 text-black"
      style={{ width: a4 ? "38.1mm" : "50mm", height: a4 ? "21.2mm" : "25mm", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="leading-tight">
        <p className="truncate text-[8px] font-bold">{s.name} <span className="font-normal">{s.pack}</span></p>
        <p className="text-[7px]">
          <span className="font-bold">B.No: {s.lotNumber}</span>
          {s.mrp ? <span> · MRP ₹{Math.round(s.mrp)} (incl. taxes)</span> : null}
        </p>
        <p className="text-[7px]">PKD: <b>{my(s.mfgDate)}</b> · Best before: <b>{my(s.expiryDate)}</b></p>
      </div>
      <div className="flex items-end justify-between gap-1">
        <div className="min-w-0 flex-1 overflow-hidden [&_svg]:h-auto [&_svg]:max-w-full">
          <Barcode value={s.lotNumber} format="CODE128" width={a4 ? 0.8 : 1} height={a4 ? 14 : 18} fontSize={0} margin={0} displayValue={false} />
        </div>
        {fssai && !a4 && <p className="shrink-0 text-right text-[6px] leading-tight">FSSAI<br />{fssai}</p>}
      </div>
    </div>
  );
}

/** Batch stickers: one per 50 × 25 mm thermal label, or 65 per A4 sheet (38.1 × 21.2 mm). */
export function BatchStickerSheet({ stickers, size, fssai }: { stickers: BatchSticker[]; size: "50x25" | "a4"; fssai: string | null }) {
  const a4 = size === "a4";
  return (
    <div>
      <style>{a4
        ? "@page { size: A4; margin: 10.7mm 4.7mm; }"
        : "@page { size: 50mm 25mm; margin: 0; } .sticker { page-break-after: always; break-after: page; }"}</style>
      <PrintToolbar title="Batch stickers" count={stickers.length} note={a4 ? "A4 sheet, 65 per page (38.1 × 21.2 mm)" : "50 × 25 mm thermal labels"} />
      {stickers.length === 0 && <p className="text-sm text-muted-foreground">No batches selected.</p>}
      <div className={a4 ? "mx-auto grid w-fit grid-cols-5 gap-0 bg-white print:mx-0" : "flex flex-wrap gap-3 print:block"}>
        {stickers.map((s, i) => (
          <div key={i} className={a4 ? "" : "border border-dashed border-border print:border-0"}>
            <Sticker s={s} a4={a4} fssai={fssai} />
          </div>
        ))}
      </div>
    </div>
  );
}
