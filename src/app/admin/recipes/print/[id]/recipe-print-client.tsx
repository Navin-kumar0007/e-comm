"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Clock, Users, ChefHat, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

export default function RecipePrintClient({ recipe }: { recipe: any }) {
  const [orientation, setOrientation] = useState<"PORTRAIT" | "LANDSCAPE">("PORTRAIT");
  const recipeUrl = `https://nuttyworld.com/recipes/${recipe.slug}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/recipes">
            <Button type="button" variant="ghost" size="icon" className="rounded-full bg-white shadow-sm"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Print Recipe Card</h1>
            <p className="text-muted-foreground mt-1">{recipe.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-lg p-1 border shadow-sm mr-2">
            <button onClick={() => setOrientation("PORTRAIT")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${orientation === 'PORTRAIT' ? 'bg-primary text-white' : 'text-gray-500 hover:text-black'}`}>Portrait 4x6</button>
            <button onClick={() => setOrientation("LANDSCAPE")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${orientation === 'LANDSCAPE' ? 'bg-primary text-white' : 'text-gray-500 hover:text-black'}`}>Landscape 6x4</button>
          </div>
          <Button type="button" onClick={() => window.print()} className="rounded-md shadow-md px-6 gap-2">
            <Printer className="w-4 h-4" /> Print Card
          </Button>
        </div>
      </div>

      {/* Print Preview Container */}
      <div className="flex justify-center print:block print:w-full">
        {orientation === "PORTRAIT" ? (
          /* 4x6 Portrait Index Card format */
          <div className="w-[4in] min-h-[6in] bg-[#FDFBF7] text-black shadow-2xl border print:shadow-none print:border-none relative overflow-hidden flex flex-col mx-auto" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            {/* Header Image Area */}
            <div className="h-40 relative shrink-0">
              {recipe.image ? (
                 <Image width={800} height={800} unoptimized={false} src={recipe.image} className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                   <ChefHat className="w-12 h-12 text-orange-300" />
                 </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                 <h1 className="text-2xl font-black text-white leading-tight">{recipe.title}</h1>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex justify-between items-center px-4 py-2 bg-orange-50 border-b border-orange-100 shrink-0 text-orange-900 text-[10px] font-bold uppercase tracking-wider">
               <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Prep: {recipe.prepTime}</div>
               <div className="flex items-center gap-1"><ChefHat className="w-3 h-3" /> Cook: {recipe.cookTime}</div>
               <div className="flex items-center gap-1"><Users className="w-3 h-3" /> Serves: {recipe.servings}</div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-4 flex flex-col gap-4 text-xs leading-snug">
               
               {/* Ingredients */}
               <div>
                 <h2 className="font-black uppercase text-orange-800 border-b border-orange-200 pb-1 mb-2 tracking-wider">Ingredients</h2>
                 <ul className="space-y-1">
                   {recipe.ingredients.slice(0, 8).map((ing: any, i: number) => (
                     <li key={i} className="flex gap-2">
                       <span className="font-bold text-orange-700 w-12 shrink-0">{ing.amount} {ing.unit}</span>
                       <span className="font-medium text-gray-800">{ing.item}</span>
                     </li>
                   ))}
                   {recipe.ingredients.length > 8 && (
                     <li className="text-gray-400 italic text-[10px]">...and more (see full recipe)</li>
                   )}
                 </ul>
               </div>

               {/* Instructions */}
               <div className="flex-1">
                 <h2 className="font-black uppercase text-orange-800 border-b border-orange-200 pb-1 mb-2 tracking-wider">Instructions</h2>
                 <ol className="list-decimal list-outside ml-3 space-y-1.5 text-gray-800 font-medium">
                   {recipe.steps.slice(0, 4).map((step: string, i: number) => (
                     <li key={i} className="pl-1 text-[11px] leading-tight line-clamp-3">{step}</li>
                   ))}
                   {recipe.steps.length > 4 && (
                     <li className="list-none text-gray-400 italic text-[10px] -ml-3 mt-1">...Scan QR to read full steps</li>
                   )}
                 </ol>
               </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 bg-orange-900 text-orange-50 flex items-center justify-between">
              <div className="w-3/4 pr-4">
                <h3 className="font-black text-sm uppercase tracking-widest mb-1 text-white">Spicy Nuts</h3>
                <p className="text-[9px] opacity-80 leading-tight font-medium">Scan the QR code to watch the video, read the full recipe, and buy the organic spices used in this dish!</p>
              </div>
              <div className="shrink-0 bg-white p-1 rounded-sm shadow-sm">
                <QRCode value={recipeUrl} size={48} level="L" bgColor="#ffffff" fgColor="#ea580c" />
              </div>
            </div>

          </div>
        ) : (
          /* 6x4 Landscape Index Card format */
          <div className="w-[6in] min-h-[4in] bg-[#FDFBF7] text-black shadow-2xl border print:shadow-none print:border-none relative overflow-hidden flex flex-row mx-auto" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            
            {/* Left Column: Image & Stats & QR */}
            <div className="w-[2.5in] shrink-0 flex flex-col bg-orange-900 text-white relative">
              <div className="h-40 relative shrink-0">
                {recipe.image ? (
                   <Image width={800} height={800} unoptimized={false} src={recipe.image} className="w-full h-full object-cover opacity-90" />
                ) : (
                   <div className="w-full h-full bg-orange-100/10 flex items-center justify-center">
                     <ChefHat className="w-12 h-12 text-orange-300" />
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900 to-transparent flex flex-col justify-end p-4">
                   <h1 className="text-xl font-black text-white leading-tight">{recipe.title}</h1>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-[10px] font-bold uppercase tracking-wider text-orange-200">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Prep: {recipe.prepTime}</div>
                  <div className="flex items-center gap-2"><ChefHat className="w-4 h-4" /> Cook: {recipe.cookTime}</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Serves: {recipe.servings}</div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="shrink-0 bg-white p-1 rounded-sm shadow-sm">
                    <QRCode value={recipeUrl} size={48} level="L" bgColor="#ffffff" fgColor="#ea580c" />
                  </div>
                  <div className="text-[9px] text-orange-100/70 leading-tight">
                    Scan for full video, ingredients, and organic spices!
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Ingredients & Instructions */}
            <div className="flex-1 p-5 flex flex-col gap-4 text-xs leading-snug">
               {/* Ingredients */}
               <div>
                 <h2 className="font-black uppercase text-orange-800 border-b border-orange-200 pb-1 mb-2 tracking-wider">Ingredients</h2>
                 <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                   {recipe.ingredients.slice(0, 10).map((ing: any, i: number) => (
                     <li key={i} className="flex gap-1 items-start text-[11px]">
                       <span className="font-bold text-orange-700 whitespace-nowrap">{ing.amount} {ing.unit}</span>
                       <span className="font-medium text-gray-800 truncate">{ing.item}</span>
                     </li>
                   ))}
                 </ul>
               </div>

               {/* Instructions */}
               <div className="flex-1">
                 <h2 className="font-black uppercase text-orange-800 border-b border-orange-200 pb-1 mb-2 tracking-wider">Instructions</h2>
                 <ol className="list-decimal list-outside ml-3 space-y-1 text-gray-800 font-medium">
                   {recipe.steps.slice(0, 4).map((step: string, i: number) => (
                     <li key={i} className="pl-1 text-[11px] leading-tight line-clamp-2">{step}</li>
                   ))}
                   {recipe.steps.length > 4 && (
                     <li className="list-none text-gray-400 italic text-[10px] -ml-3 mt-1">...Scan QR to read full steps</li>
                   )}
                 </ol>
               </div>
               
               <div className="text-right text-orange-800 font-heading font-bold text-sm">
                 Spicy Nuts
               </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
