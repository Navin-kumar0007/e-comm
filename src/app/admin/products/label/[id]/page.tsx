import { requirePagePermission } from "@/lib/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import Barcode from "@/components/ui/barcode";
import { getStoreSettings } from "@/lib/store-settings";

/** FSSAI registration shown on the home page and at checkout, used when Settings has none. */
const FSSAI_ON_SITE = "21224035000151";
const monthYear = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export const metadata = {
  title: "Packaging Label - Spicy Nuts Admin",
};

export default async function ProductLabelPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("catalog.manage");
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id },
    include: { category: true }
  });

  if (!product) {
    notFound();
  }

  // Batch, packing date and best-before come from the latest packed lot (Admin → Batches / Pack from bulk).
  // With no lot yet they print blank, to be filled in, rather than invented.
  const [settings, lot] = await Promise.all([
    getStoreSettings(),
    prisma.stockLot.findFirst({
      where: { productId: product.id, kind: "PACK" },
      orderBy: { receivedAt: "desc" },
      select: { lotNumber: true, mfgDate: true, expiryDate: true, receivedAt: true },
    }),
  ]);
  const blank = "__________";
  const batchNumber = lot?.lotNumber ?? null;
  const packedDate = lot ? monthYear(lot.mfgDate ?? lot.receivedAt) : blank;
  const bestBefore = lot?.expiryDate ? monthYear(lot.expiryDate) : blank;
  const fssai = settings.fssaiLicense || FSSAI_ON_SITE;
  const packer = settings.legalName || "B.M.V. Spices & Dry Fruits";

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation & Controls Bar (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
          <Link href="/admin/products">
            <Button variant="ghost" className="rounded-full gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Products
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Standard 100mm × 150mm Jar / Pouch Sticker
            </span>
            <LabelPrintButton />
          </div>
        </div>
        {!lot && (
          <p className="print:hidden rounded-xl border border-brand-gold/50 bg-[#fff8e8] p-3 text-sm">
            No packed batch is recorded for this product yet, so batch, packing date and best-before print blank. Record the packing under Pack from bulk, or print batch stickers from Batches.
          </p>
        )}

        {/* Printable Label Sheet */}
        <div className="flex justify-center print:block">
          <div className="w-[105mm] min-h-[148mm] bg-white text-black p-6 rounded-2xl border-2 border-black/80 shadow-xl print:shadow-none print:border-2 print:rounded-none print:mx-auto font-sans text-xs relative flex flex-col justify-between">
            
            {/* Top Brand Header */}
            <div className="border-b-2 border-black pb-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-heading font-black text-lg uppercase tracking-wider text-black">
                <Leaf className="w-5 h-5 text-green-800" />
                <span>SPICY NUTS</span>
              </div>
            </div>

            {/* Product Title & Weight */}
            <div className="py-3 text-center space-y-1">
              <h2 className="font-heading font-black text-base uppercase leading-tight text-gray-900">
                {product.name}
              </h2>
              <p className="text-[11px] font-semibold text-gray-700">
                Category: {product.category?.name || "Gourmet Dry Fruits"}
              </p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1 bg-black text-white font-black text-sm rounded-md tracking-wider">
                  NET WT: {product.weight || "250g"}
                </span>
              </div>
            </div>

            {/* Ingredients & Origin */}
            <div className="border-t border-dashed border-gray-400 py-2.5 space-y-1 text-[10px]">
              <p><strong>Ingredients:</strong> {product.ingredients || product.name}</p>
              <p><strong>Storage:</strong> Store in a cool, dry place. Seal tightly after opening.</p>
            </div>

            {/* Pricing, Batch & Dates Grid */}
            <div className="border-t-2 border-b-2 border-black py-2 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <p><strong>Batch / Lot:</strong> {batchNumber ?? blank}</p>
                <p><strong>Packed:</strong> {packedDate}</p>
                <p><strong>Best Before:</strong> {bestBefore}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm text-black">MRP: ₹{product.mrp ?? product.price}</p>
                <p className="text-[9px] text-gray-600">(Incl. of all taxes)</p>
              </div>
            </div>

            {/* Barcode & FSSAI Footer */}
            <div className="pt-3 flex items-end justify-between">
              <div>
                <p className="font-bold text-[9px] uppercase tracking-wider">FSSAI Reg. No: {fssai}</p>
                <p className="text-[8px] text-gray-600 leading-tight mt-0.5">
                  Mkd &amp; Pkd by: {packer}, Shop No 1/206/1, Bhaskar Nagar, Chitguppa, Bidar, Karnataka 585412<br />
                  Customer Care: spicynuts1973@gmail.com
                </p>
              </div>

              {/* Real product barcode when one is set in the catalogue */}
              <div className="text-right flex flex-col items-end">
                {product.barcode && <Barcode value={product.barcode} height={28} width={1.2} fontSize={9} margin={0} displayValue background="#ffffff" />}
                {batchNumber && <span className="font-mono text-[9px] tracking-widest mt-0.5">{batchNumber}</span>}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

function LabelPrintButton() {
  'use client';
  return (
    <Button 
      onClick={() => window.print()} 
      className="rounded-xl gap-2 font-semibold shadow-sm"
    >
      <Printer className="w-4 h-4" /> Print Label
    </Button>
  );
}
