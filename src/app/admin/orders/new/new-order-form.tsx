"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrderAction } from "@/app/actions/admin-orders";
import { toast } from "sonner";

export default function NewOrderForm({ products, settings, buyers = [], initialBuyer }: { products: any[], settings: any, buyers?: any[], initialBuyer?: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [buyerId, setBuyerId] = useState<string>(initialBuyer && buyers.some((b) => b.id === initialBuyer) ? initialBuyer : "");
  const buyer = buyers.find((b) => b.id === buyerId) ?? null;
  const discountPct = buyer?.wholesaleDiscount ?? 0;
  const priceFor = (retail: number, pct = discountPct) => Math.round(retail * (1 - pct / 100) * 100) / 100;
  const chooseBuyer = (id: string) => {
    setBuyerId(id);
    const b = buyers.find((x) => x.id === id);
    const pct = b?.wholesaleDiscount ?? 0;
    setItems((cur) => cur.map((i) => ({ ...i, price: priceFor(i.retail, pct) })));
  };
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);

  const matchingProducts = productSearch
    ? products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 5)
    : [];

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      const retail = product.salePrice || product.price;
      setItems([...items, { name: product.name, quantity: 1, retail, price: priceFor(retail), weight: product.weight, productId: product.id }]);
    }
    setProductSearch("");
    setShowProductPicker(false);
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setItems(items.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const removeItem = (productId: string) => setItems(items.filter(i => i.productId !== productId));

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= (settings?.freeShippingThreshold ?? 999) ? 0 : (settings?.flatShippingRate ?? 50);
  const total = subtotal + shipping;
  // Prices are GST-inclusive; this is the GST portion of the total.
  const gstRate = settings?.gstRate ?? 5;
  const tax = (total * gstRate) / (100 + gstRate);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Add at least one item"); return; }
    setIsSaving(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await createOrderAction({
        customerName: fd.get("customer") as string,
        customerEmail: fd.get("email") as string,
        customerPhone: fd.get("phone") as string,
        shippingAddress: fd.get("address") as string,
        customerGstin: buyer?.gstin ?? null,
        userId: buyer?.id ?? null,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          weight: i.weight
        }))
      });
      if (res && "error" in res) {
        toast.error(res.error);
        setIsSaving(false);
        return;
      }
      toast.success("Order created successfully!");
      router.push("/admin/orders");
    } catch (err) {
      toast.error("Failed to create order");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders"><Button type="button" variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Create Order</h1>
          <p className="text-muted-foreground mt-1">Manually create an order for phone/walk-in customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
            <h2 className="font-heading font-bold text-lg text-foreground">Customer Information</h2>
            {buyers.length > 0 && (
              <div className="space-y-2">
                <Label>Wholesale buyer</Label>
                <select value={buyerId} onChange={(e) => chooseBuyer(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">Walk-in / phone customer (retail prices)</option>
                  {buyers.map((b) => <option key={b.id} value={b.id}>{b.businessName || b.name}{b.wholesaleDiscount ? ` · ${b.wholesaleDiscount}% off` : ""}</option>)}
                </select>
                {buyer && <p className="text-xs text-muted-foreground">{buyer.gstin ? `GSTIN ${buyer.gstin} will be printed on the invoice. ` : "No GSTIN on file. "}{discountPct ? `Prices are ${discountPct}% below retail.` : ""}</p>}
              </div>
            )}
            <div key={buyerId} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Full Name *</Label><Input name="customer" required defaultValue={buyer ? (buyer.businessName ? `${buyer.businessName} (${buyer.name})` : buyer.name) : ""} placeholder="John Doe" className="rounded-xl" /></div>
                <div className="space-y-2"><Label>Email *</Label><Input name="email" required type="email" defaultValue={buyer?.email ?? ""} placeholder="john@example.com" className="rounded-xl" /></div>
              </div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={buyer?.phone ?? ""} placeholder="e.g. 98765 43210" className="rounded-xl" /></div>
              <div className="space-y-2"><Label>Shipping Address *</Label><Textarea name="address" required defaultValue={buyer ? [buyer.address, buyer.city, buyer.state, buyer.pincode].filter(Boolean).join(", ") : ""} placeholder="Full address with pincode" rows={2} className="rounded-xl" /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input name="notes" placeholder="Special instructions..." className="rounded-xl" /></div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-5">
            <h2 className="font-heading font-bold text-lg text-foreground">Order Items</h2>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductPicker(true); }}
                  onFocus={() => setShowProductPicker(true)}
                  placeholder="Search products to add..."
                  className="pl-10 rounded-xl"
                />
              </div>
              {showProductPicker && matchingProducts.length > 0 && (
                <div className="absolute z-10 top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {matchingProducts.map(p => (
                    <button key={p.id} type="button" onClick={() => addItem(p)}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 flex justify-between items-center text-sm text-foreground">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground">₹{p.salePrice || p.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No items added yet. Search and select products above.</div>
            ) : (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={item.productId} className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.weight} · ₹{item.price} each{item.price !== item.retail ? <span className="ml-1 line-through">₹{item.retail}</span> : null}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updateItemQty(item.productId, item.quantity - 1)}>-</Button>
                      <span className="w-8 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updateItemQty(item.productId, item.quantity + 1)}>+</Button>
                    </div>
                    <div className="font-medium text-sm w-20 text-right text-foreground">₹{(item.price * item.quantity).toFixed(2)}</div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.productId)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4 sticky top-6">
            <h2 className="font-heading font-bold text-lg text-foreground">Order Summary</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t text-foreground"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span>incl. GST ({gstRate}%)</span><span>₹{tax.toFixed(2)}</span></div>
            </div>
            <Button type="submit" disabled={isSaving || items.length === 0} className="w-full rounded-full shadow-md mt-4">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
