import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Leaf, ShieldCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Packaging Label - Spicy Nuts Admin",
};

export default async function ProductLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { id: resolvedParams.id },
    include: { category: true }
  });

  if (!product) {
    notFound();
  }

  const batchNumber = `NW-LOT-${product.id.slice(-6).toUpperCase()}`;
  const packedDate = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const bestBefore = new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

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

        {/* Printable Label Sheet */}
        <div className="flex justify-center print:block">
          <div className="w-[105mm] min-h-[148mm] bg-white text-black p-6 rounded-2xl border-2 border-black/80 shadow-xl print:shadow-none print:border-2 print:rounded-none print:mx-auto font-sans text-xs relative flex flex-col justify-between">
            
            {/* Top Brand Header */}
            <div className="border-b-2 border-black pb-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-heading font-black text-lg uppercase tracking-wider text-black">
                <Leaf className="w-5 h-5 text-green-800" />
                <span>SPICY NUTS</span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-700">
                Pure • Natural • Single-Estate Harvest
              </p>
              <div className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border border-black/40">
                <ShieldCheck className="w-3 h-3 text-green-700" /> Grade A1 Connoisseur Reserve
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
              <p><strong>Ingredients:</strong> {product.ingredients || "100% Pure Natural Kernels (Zero Additives)"}</p>
              <p><strong>Terroir Origin:</strong> Single-Estate Certified Partner Groves</p>
              <p><strong>Storage:</strong> Store in a cool, dry place. Seal tightly after opening.</p>
            </div>

            {/* Pricing, Batch & Dates Grid */}
            <div className="border-t-2 border-b-2 border-black py-2 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <p><strong>Batch / Lot:</strong> {batchNumber}</p>
                <p><strong>Packed:</strong> {packedDate}</p>
                <p><strong>Best Before:</strong> {bestBefore}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 line-through">MRP: ₹{product.mrp || (Number(product.price) * 1.25).toFixed(0)}</p>
                <p className="font-black text-sm text-black">OFFER: ₹{product.salePrice || product.price}</p>
                <p className="text-[9px] text-gray-600">(Incl. of all taxes)</p>
              </div>
            </div>

            {/* Barcode & FSSAI Footer */}
            <div className="pt-3 flex items-end justify-between">
              <div>
                <p className="font-bold text-[9px] uppercase tracking-wider">FSSAI Lic No: 10020021000456</p>
                <p className="text-[8px] text-gray-600 leading-tight mt-0.5">
                  Mkd & Pkd by: Spicy Nuts Gourmet Pvt Ltd<br />
                  Customer Care: spicynuts1973@gmail.com
                </p>
              </div>

              {/* Simulated Barcode */}
              <div className="text-right flex flex-col items-end">
                <div className="flex gap-[2px] items-end h-7 w-28 bg-white">
                  {[3,1,2,1,3,2,1,3,1,2,1,3,2,1,1,3,2,1,3,1,2,3].map((w, i) => (
                    <div 
                      key={i} 
                      className="bg-black h-full" 
                      style={{ width: `${w * 1.5}px` }} 
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] tracking-widest mt-0.5">{batchNumber}</span>
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
