"use client";

import Barcode from "@/components/ui/barcode";
import { PrintToolbar } from "../../print/print-docs";
import type { BarcodeRow } from "@/app/actions/admin-barcodes";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Sticker({ r, a4 }: { r: BarcodeRow; a4: boolean }) {
  return (
    <div
      className="sticker flex flex-col items-center justify-center overflow-hidden bg-white px-1 text-black"
      style={{ width: a4 ? "38.1mm" : "50mm", height: a4 ? "21.2mm" : "25mm", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <p className="w-full truncate text-center text-[8px] font-bold leading-tight">{r.name}</p>
      <p className="text-[7px] leading-tight">{r.pack}{r.mrp ? ` · MRP ${inr(r.mrp)}` : ` · ${inr(r.price)}`}</p>
      <Barcode value={r.barcode!} format="EAN13" width={a4 ? 1 : 1.2} height={a4 ? 26 : 34} fontSize={9} margin={0} flat />
    </div>
  );
}

/** Barcode stickers: one per 50 × 25 mm thermal label, or 65 per A4 sheet (38.1 × 21.2 mm). */
export function StickerSheet({ stickers, size }: { stickers: BarcodeRow[]; size: "50x25" | "a4" }) {
  const a4 = size === "a4";
  return (
    <div>
      <style>{a4
        ? "@page { size: A4; margin: 10.7mm 4.7mm; }"
        : "@page { size: 50mm 25mm; margin: 0; } .sticker { page-break-after: always; break-after: page; }"}</style>
      <PrintToolbar title="Barcode stickers" count={stickers.length} note={a4 ? "A4 sheet, 65 per page (38.1 × 21.2 mm)" : "50 × 25 mm thermal labels"} />
      {stickers.length === 0 && <p className="text-sm text-muted-foreground">No stickers selected, or the selected items have no barcode yet.</p>}
      <div className={a4 ? "mx-auto grid w-fit grid-cols-5 gap-0 bg-white print:mx-0" : "flex flex-wrap gap-3 print:block"}>
        {stickers.map((r, i) => (
          <div key={i} className={a4 ? "" : "border border-dashed border-border print:border-0"}>
            <Sticker r={r} a4={a4} />
          </div>
        ))}
      </div>
    </div>
  );
}
