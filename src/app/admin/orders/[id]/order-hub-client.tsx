"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Printer, Leaf, MapPin, Phone, Mail, Box, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateInvoiceNotesAction } from "@/app/actions/admin-orders";
import Barcode from "@/components/ui/barcode";

export default function OrderHubClient({ order }: { order: any }) {
  const [activeTab, setActiveTab] = useState<"DETAILS" | "INVOICE" | "DISPATCH">("INVOICE");
  const [invoiceSize, setInvoiceSize] = useState<"A4" | "THERMAL">("A4");
  const [invoiceNotes, setInvoiceNotes] = useState(order.invoiceNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  const subtotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const shipping = subtotal > 999 ? 0 : 50;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await updateInvoiceNotesAction(order.id, invoiceNotes);
      toast.success("Invoice notes saved!");
    } catch (error) {
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button type="button" variant="ghost" size="icon" className="rounded-full bg-white shadow-sm"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h1>
            <p className="text-muted-foreground mt-1">Manage, print invoice, and dispatch note</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 print:hidden">
        {["DETAILS", "INVOICE", "DISPATCH"].map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            {tab === "DETAILS" ? "Order Details" : tab === "INVOICE" ? "Invoice Generator" : "Dispatch Note"}
          </button>
        ))}
      </div>

      {/* TAB: DETAILS */}
      <div className={activeTab === "DETAILS" ? "block print:hidden" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm">
              <h2 className="font-heading font-bold text-lg mb-4">Items Ordered</h2>
              <div className="space-y-4">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Weight: {item.weight}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{item.price} × {item.quantity}</p>
                      <p className="text-sm font-bold">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg">Customer</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600"><div className="font-medium text-black">{order.customerName}</div></div>
                <div className="flex items-center gap-3 text-gray-600"><Mail className="w-4 h-4" /> {order.customerEmail}</div>
                <div className="flex items-center gap-3 text-gray-600"><Phone className="w-4 h-4" /> {order.customerPhone}</div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4">
              <h2 className="font-heading font-bold text-lg">Shipping</h2>
              <div className="flex items-start gap-3 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="whitespace-pre-line">{order.shippingAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* TAB: INVOICE GENERATOR */}
      <div className={activeTab === "INVOICE" ? "block" : "hidden"}>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="w-full lg:w-[350px] shrink-0 space-y-6 print:hidden">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col gap-4">
               <div>
                  <h3 className="font-bold text-primary mb-1">Invoice Controls</h3>
                  <p className="text-xs text-primary/70">Configure your invoice layout and add custom notes.</p>
               </div>
               
               <div className="flex bg-white rounded-lg p-1 border">
                  <button onClick={() => setInvoiceSize("A4")} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${invoiceSize === 'A4' ? 'bg-primary text-white' : 'text-gray-500 hover:text-black'}`}>A4 Size</button>
                  <button onClick={() => setInvoiceSize("THERMAL")} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${invoiceSize === 'THERMAL' ? 'bg-primary text-white' : 'text-gray-500 hover:text-black'}`}>Thermal (POS)</button>
               </div>
               
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Custom Footer Note</label>
                 <Textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} placeholder="e.g. Thank you for your support!" className="bg-white text-sm min-h-[80px]" />
                 <Button onClick={handleSaveNotes} disabled={isSaving} size="sm" className="w-full">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Note
                 </Button>
               </div>

               <Button type="button" onClick={() => window.print()} className="w-full gap-2 shadow-sm mt-2" variant="outline">
                 <Printer className="w-4 h-4" /> Print Invoice
               </Button>
            </div>
          </div>

          <div className="w-full flex-1 flex justify-center print:block print:w-full">
            
            {/* A4 INVOICE LAYOUT */}
            {invoiceSize === "A4" && (
              <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 sm:p-12 rounded-xl shadow-lg border print:shadow-none print:border-none print:p-0 print:mx-auto">
                <div className="flex justify-between items-start border-b pb-8 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-green-700">
                      <Leaf className="h-8 w-8" />
                      <span className="font-heading text-3xl font-bold">Nutty World</span>
                    </div>
                    <p className="text-sm text-gray-500">Pure, Natural, Organic Spices</p>
                    <p className="text-sm text-gray-500">GSTIN: 27AABCU9603R1ZM</p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-4xl font-heading font-black text-gray-900 uppercase tracking-wider mb-2">TAX INVOICE</h1>
                    <p className="text-sm"><span className="font-bold text-gray-500">Invoice #:</span> INV-{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm"><span className="font-bold text-gray-500">Date:</span> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-50/50 p-6 rounded-xl">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
                    <p className="font-bold text-lg text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-600">{order.customerEmail}</p>
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shipped To</h3>
                    <p className="text-sm text-gray-800 font-medium whitespace-pre-line leading-relaxed">{order.shippingAddress}</p>
                  </div>
                </div>

                <table className="w-full text-left mb-8 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black/10">
                      <th className="py-3 px-2 text-sm font-bold text-gray-500 uppercase tracking-wider">Item Description</th>
                      <th className="py-3 px-2 text-sm font-bold text-gray-500 uppercase tracking-wider text-center">Qty</th>
                      <th className="py-3 px-2 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Price</th>
                      <th className="py-3 px-2 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-4 px-2">
                          <p className="font-bold text-gray-900">{item.product.name}</p>
                          <p className="text-xs font-medium text-gray-500">Weight: {item.weight}</p>
                        </td>
                        <td className="py-4 px-2 text-center font-medium text-gray-700">{item.quantity}</td>
                        <td className="py-4 px-2 text-right text-gray-600">₹{item.price.toFixed(2)}</td>
                        <td className="py-4 px-2 text-right font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-4 mb-16">
                  <div className="w-72 space-y-3 bg-gray-50 p-6 rounded-xl">
                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 font-medium pb-3 border-b border-gray-200">
                      <span>GST (5%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-gray-900 pt-1">
                      <span>Total</span>
                      <span>₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t-2 border-black/10 text-center space-y-2">
                  <p className="font-medium text-gray-800 text-lg">{invoiceNotes || "Thank you for your order!"}</p>
                  <p className="text-xs text-gray-500">For support, email us at support@nuttyworld.com</p>
                </div>
              </div>
            )}

            {/* THERMAL RECEIPT LAYOUT */}
            {invoiceSize === "THERMAL" && (
              <div className="w-[80mm] min-h-[150mm] bg-white text-black p-4 rounded-xl shadow-lg border print:shadow-none print:border-none print:p-0 font-mono text-sm leading-tight mx-auto">
                <div className="text-center mb-6 border-b border-dashed border-gray-400 pb-4">
                  <h1 className="font-black text-xl mb-1 uppercase tracking-tight">Nutty World</h1>
                  <p className="text-xs">Organic Spices</p>
                  <p className="text-xs">GST: 27AABCU9603R1ZM</p>
                </div>

                <div className="mb-4 text-xs">
                  <p><strong>Order:</strong> INV-{order.id.slice(-6).toUpperCase()}</p>
                  <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-IN')} {new Date(order.createdAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}</p>
                  <p className="mt-2"><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Phone:</strong> {order.customerPhone}</p>
                </div>

                <div className="border-y border-dashed border-gray-400 py-2 mb-4">
                  <div className="flex justify-between font-bold text-xs mb-2">
                    <span className="w-1/2">Item</span>
                    <span className="w-1/4 text-center">Qty</span>
                    <span className="w-1/4 text-right">Amt</span>
                  </div>
                  
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs mb-1.5 items-start">
                      <div className="w-1/2 pr-1">
                        <span className="block truncate">{item.product.name}</span>
                        <span className="text-[10px] text-gray-500">{item.weight} @ {item.price}</span>
                      </div>
                      <span className="w-1/4 text-center mt-1">{item.quantity}</span>
                      <span className="w-1/4 text-right mt-1 font-bold">{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 mb-4 text-xs border-b border-dashed border-gray-400 pb-4">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping:</span><span>{shipping.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax (5%):</span><span>{tax.toFixed(2)}</span></div>
                  <div className="flex justify-between text-base font-black mt-2 pt-2 border-t border-gray-200">
                    <span>TOTAL:</span><span>₹{order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-xs space-y-3">
                  <p className="font-bold">{invoiceNotes || "THANK YOU!"}</p>
                  <div className="flex justify-center">
                    <Barcode value={order.id.slice(0, 10).toUpperCase()} width={1.2} height={30} fontSize={10} displayValue={true} />
                  </div>
                  <p className="text-[10px] text-gray-500">nuttyworld.com</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* TAB: DISPATCH NOTE */}
      <div className={activeTab === "DISPATCH" ? "block" : "hidden"}>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-[350px] shrink-0 space-y-6 print:hidden">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col gap-4">
               <div>
                  <h3 className="font-bold text-blue-900 mb-1">Dispatch Note (Packing Slip)</h3>
                  <p className="text-xs text-blue-800/80">A clean checklist for the warehouse team. Excludes all pricing and billing info.</p>
               </div>
               <Button type="button" onClick={() => window.print()} className="w-full gap-2 shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
                 <Printer className="w-4 h-4" /> Print Packing Slip
               </Button>
            </div>
          </div>

          <div className="w-full flex-1 flex justify-center print:block print:w-full">
            <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 sm:p-12 rounded-xl shadow-lg border print:shadow-none print:border-none print:p-0 print:mx-auto">
              
              <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
                <div>
                  <h1 className="text-4xl font-black uppercase tracking-tight">PACKING SLIP</h1>
                  <p className="text-lg font-bold mt-2">Order: #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                   <div className="bg-white p-2 rounded-lg border-2 border-black">
                     <Barcode value={order.id.slice(0, 12).toUpperCase()} width={1.5} height={40} fontSize={12} displayValue={true} />
                   </div>
                </div>
              </div>

              <div className="mb-10">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 border-b pb-2">Ship To</h3>
                <div className="flex items-start gap-4">
                  <div className="bg-gray-100 p-3 rounded-lg"><Box className="w-6 h-6 text-gray-600" /></div>
                  <div>
                    <p className="font-black text-xl">{order.customerName}</p>
                    <p className="text-lg text-gray-800 font-medium whitespace-pre-line mt-1">{order.shippingAddress}</p>
                    <p className="text-gray-600 mt-2 font-medium">Phone: {order.customerPhone}</p>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 border-b pb-2">Items to Pack</h3>
              <table className="w-full text-left border-collapse border-2 border-black">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-black">
                    <th className="py-4 px-4 text-sm font-black uppercase w-16 border-r border-black text-center">Pack</th>
                    <th className="py-4 px-4 text-sm font-black uppercase">Item Name</th>
                    <th className="py-4 px-4 text-sm font-black uppercase border-l border-black">Weight</th>
                    <th className="py-4 px-4 text-sm font-black uppercase text-center border-l-2 border-black w-24">QTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20">
                  {order.items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-6 px-4 border-r border-black text-center">
                        <div className="w-6 h-6 border-2 border-gray-400 rounded-sm mx-auto"></div>
                      </td>
                      <td className="py-6 px-4">
                        <p className="font-bold text-lg">{item.product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {item.productId.slice(0,8).toUpperCase()}</p>
                      </td>
                      <td className="py-6 px-4 border-l border-black font-medium text-gray-700">
                        {item.weight}
                      </td>
                      <td className="py-6 px-4 text-center font-black text-2xl border-l-2 border-black bg-gray-50">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-16 flex gap-8">
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                   <p className="text-sm font-bold text-gray-400 uppercase mb-4">Packed By</p>
                   <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                   <p className="text-xs text-gray-500">Sign / Date</p>
                </div>
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                   <p className="text-sm font-bold text-gray-400 uppercase mb-4">Verified By</p>
                   <div className="border-b border-black w-3/4 mx-auto mb-2"></div>
                   <p className="text-xs text-gray-500">Sign / Date</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}