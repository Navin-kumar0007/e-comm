"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Ticket, Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import Barcode from "@/components/ui/barcode";

export default function CouponPrintClient({ coupon }: { coupon: any }) {
  const [orientation, setOrientation] = useState<"LANDSCAPE" | "PORTRAIT">("LANDSCAPE");
  const storeUrl = `https://nuttyworld.com/?coupon=${coupon.code}`;

  const formatDiscount = () => {
    return coupon.discountType === "PERCENTAGE" 
      ? `${coupon.discountValue}% OFF`
      : `₹${coupon.discountValue} OFF`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/coupons">
            <Button type="button" variant="ghost" size="icon" className="rounded-full bg-white shadow-sm"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Print Golden Ticket</h1>
            <p className="text-muted-foreground mt-1">Code: {coupon.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-lg p-1 border shadow-sm mr-2">
            <button onClick={() => setOrientation("LANDSCAPE")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${orientation === 'LANDSCAPE' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-black'}`}>Landscape Ticket</button>
            <button onClick={() => setOrientation("PORTRAIT")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${orientation === 'PORTRAIT' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-black'}`}>Portrait Tag</button>
          </div>
          <Button type="button" onClick={() => window.print()} className="rounded-md shadow-md px-6 gap-2 bg-amber-500 hover:bg-amber-600 text-white">
            <Printer className="w-4 h-4" /> Print Ticket
          </Button>
        </div>
      </div>

      {/* Print Preview Container */}
      <div className="flex justify-center print:block print:w-full">
        {orientation === "LANDSCAPE" ? (
          /* Landscape Golden Ticket format (approx 6x2.5 inch) */
          <div className="w-[6in] h-[2.5in] bg-gradient-to-r from-amber-50 via-yellow-100 to-amber-50 text-amber-900 shadow-2xl border-2 border-amber-300 relative overflow-hidden flex mx-auto" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center overflow-hidden">
               <div className="text-[120px] font-black tracking-tighter rotate-12 whitespace-nowrap">GOLDEN TICKET</div>
            </div>
            
            {/* Left Section - Main Info */}
            <div className="flex-1 p-6 flex flex-col justify-between relative z-10 border-r-2 border-dashed border-amber-300">
               <div>
                 <div className="flex items-center gap-2 text-amber-700 mb-1">
                   <Leaf className="w-5 h-5" />
                   <span className="font-heading font-black tracking-widest uppercase text-sm">Nutty World</span>
                 </div>
                 <h2 className="text-3xl font-black uppercase text-amber-900 mt-2 mb-1 flex items-center gap-2">
                   <Sparkles className="w-6 h-6 text-amber-500" />
                   {formatDiscount()}
                 </h2>
                 <p className="text-amber-800/80 text-xs font-medium uppercase tracking-widest">On Your Next Purchase</p>
               </div>
               
               <div>
                  <p className="text-[10px] text-amber-700 font-bold mb-1 uppercase tracking-wider">Use Code at Checkout</p>
                  <div className="bg-white/80 border border-amber-300 px-4 py-2 inline-block font-mono text-xl font-black tracking-widest text-black shadow-inner">
                    {coupon.code}
                  </div>
               </div>
            </div>

            {/* Right Section - QR & Terms */}
            <div className="w-[1.8in] shrink-0 p-4 flex flex-col items-center justify-center bg-amber-500/10 relative z-10">
               <div className="bg-white p-1.5 shadow-sm rounded-sm mb-3">
                 <QRCode value={storeUrl} size={64} level="M" bgColor="#ffffff" fgColor="#78350f" />
               </div>
               <p className="text-[9px] font-bold text-center uppercase tracking-wider text-amber-800 mb-2">Scan to Shop</p>
               
               <div className="mt-auto text-center w-full">
                 <Barcode value={coupon.code} width={1} height={20} fontSize={8} displayValue={false} />
                 {coupon.expiryDate && (
                   <p className="text-[8px] mt-2 font-medium text-amber-700">Valid till: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                 )}
               </div>
            </div>
          </div>
        ) : (
          /* Portrait Gift Tag format (approx 2.5x5 inch) */
          <div className="w-[2.5in] h-[5in] bg-gradient-to-b from-amber-50 via-yellow-100 to-amber-50 text-amber-900 shadow-2xl border-2 border-amber-300 relative overflow-hidden flex flex-col mx-auto" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            {/* Tag Hole */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-amber-200 shadow-inner z-20"></div>

            <div className="flex-1 p-5 pt-10 flex flex-col items-center text-center relative z-10">
               <div className="flex flex-col items-center gap-1 text-amber-700 mb-6">
                 <Leaf className="w-8 h-8" />
                 <span className="font-heading font-black tracking-widest uppercase text-xs">Nutty World</span>
               </div>
               
               <div className="bg-white/80 border border-amber-200 w-full py-4 px-2 rounded-lg shadow-sm mb-6">
                 <p className="text-amber-800/80 text-[9px] font-bold uppercase tracking-widest mb-1">A Gift For You</p>
                 <h2 className="text-2xl font-black text-amber-900 flex items-center justify-center gap-1">
                   {formatDiscount()}
                 </h2>
               </div>
               
               <div className="mb-6 w-full">
                  <p className="text-[9px] text-amber-700 font-bold mb-1 uppercase tracking-wider">Use Code at Checkout</p>
                  <div className="bg-white border-2 border-dashed border-amber-400 py-2 w-full font-mono text-lg font-black tracking-widest text-black">
                    {coupon.code}
                  </div>
               </div>

               <div className="mt-auto flex flex-col items-center w-full">
                 <div className="bg-white p-1.5 shadow-sm rounded-sm mb-2">
                   <QRCode value={storeUrl} size={56} level="M" bgColor="#ffffff" fgColor="#78350f" />
                 </div>
                 <p className="text-[8px] font-bold uppercase tracking-wider text-amber-800">Scan to Shop</p>
                 {coupon.expiryDate && (
                   <p className="text-[8px] mt-3 font-medium text-amber-700 bg-amber-200/50 px-2 py-0.5 rounded-full">Valid till: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
