'use client';

import Image from "next/image";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart-store";
import { getCleanProductImage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Script from "next/script";
import { getCheckoutQuote, type CheckoutQuoteResult } from "@/app/actions/checkout-quote";
import { getUserPoints, getUserProfile } from "@/app/actions/user";
import { AddressMapSelector } from "@/components/storefront/address-map-selector";
import { useSession } from "next-auth/react";
import { Truck, ShieldCheck, ChevronDown, ChevronUp, UserCheck, Sparkles, ShoppingBag, Tag, Lock, MapPin, Smartphone, Banknote, BadgeCheck, Package } from "lucide-react";
import { CheckoutSteps } from "@/components/storefront/royal/checkout-steps";
import { orderRef } from "@/lib/site";

const noopSubscribe = () => () => {};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { data: session } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const cartTotal = getTotal();
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [quote, setQuote] = useState<CheckoutQuoteResult | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (session) {
      getUserPoints().then(setUserPoints);
      getUserProfile().then((profile) => {
        if (profile) {
          setFormData((prev) => ({
            ...prev,
            name: prev.name || profile.name || "",
            email: prev.email || profile.email || "",
            address: prev.address || profile.address || "",
            city: prev.city || profile.city || "",
            state: prev.state || profile.state || "",
            pincode: prev.pincode || profile.pincode || "",
          }));
        }
      });
    }
  }, [session]);
  

  // Only ask the server about complete, valid pincodes.
  const validPincode = /^[1-9]\d{5}$/.test(formData.pincode.trim()) ? formData.pincode.trim() : "";

  const quoteItems = () =>
    items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      weight: item.weight,
      name: item.name,
      blend: item.blend,
    }));

  // Server-calculated totals (shipping, GST, discounts) — same logic as the charge.
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    getCheckoutQuote({ items: quoteItems(), couponCode: appliedCoupon, usePoints, pincode: validPincode }).then((res) => {
      if (!cancelled) setQuote(res);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, appliedCoupon, usePoints, validPincode]);

  const delivery = validPincode ? quote?.delivery ?? null : null;
  const codBlocked = !!delivery && !delivery.codAvailable;
  const notServiceable = !!delivery && !delivery.serviceable;

  // Switch away from COD when it isn't available for this pincode / order value.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- switch away from COD once the server says this pincode or total cannot use it
    if (codBlocked && paymentMethod === 'cod') setPaymentMethod('razorpay');
  }, [codBlocked, paymentMethod]);

  const discount = quote?.couponDiscount ?? 0;
  const pointsDiscount = quote?.pointsDiscount ?? 0;
  const shippingFee = quote?.shippingFee ?? 0;
  const total = quote?.total ?? cartTotal;
  const quoteReady = !!quote && !quote.error;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const res = await getCheckoutQuote({ items: quoteItems(), couponCode: code, usePoints, pincode: validPincode });
    if (res.error || res.couponError) {
      toast.error(res.error || res.couponError);
      return;
    }
    setAppliedCoupon(code);
    setQuote(res);
    toast.success("Coupon applied!");
  };
  
  // The saved cart loads just after the first render; only send people back to the shop
  // once it has loaded and really is empty (otherwise a refresh here bounced to /shop).
  const cartLoaded = useSyncExternalStore(noopSubscribe, () => true, () => false);
  useEffect(() => {
    if (cartLoaded && items.length === 0 && !isProcessing) {
      router.push("/shop");
    }
  }, [cartLoaded, items, router, isProcessing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrderSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!quoteReady) {
      toast.error(quote?.error || "Still calculating your total. Please try again in a moment.");
      return;
    }
    if (notServiceable) {
      toast.error("Sorry, we don't deliver to this pincode yet.");
      return;
    }

    // Validate phone number format (at least 10 digits)
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order on backend (server re-prices everything)
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: quoteItems(),
          shippingDetails: formData,
          paymentMethod: paymentMethod,
          couponCode: appliedCoupon,
          usePoints: usePoints,
        }),
      });
      const order = await res.json();

      if (order.error) throw new Error(order.error);

      const saveConfirmation = (paymentLabel: string) => {
        sessionStorage.setItem('lastOrder', JSON.stringify({
          orderNumber: orderRef(order.orderId),
          orderId: order.orderId,
          subtotal: order.subtotal,
          discount: order.discount,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total,
          paymentMethod: paymentLabel,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
          ecoPackaging: true,
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            weight: item.weight,
          }))
        }));
      };

      // 2. Handle Cash on Delivery (COD) Direct Flow
      if (paymentMethod === 'cod') {
        saveConfirmation('Cash on Delivery (COD)');
        clearCart();
        toast.success("Order Placed Successfully!");
        router.push("/order-confirmation");
        return;
      }

      // 3. Handle Razorpay Online Payment Flow
      const handler = async (response: any) => {
        const verifyRes = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: order.orderId,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          saveConfirmation('Online Payment (Prepaid)');
          clearCart();
          toast.success("Payment Successful! Order confirmed.");
          router.push("/order-confirmation");
        } else {
          toast.error(verifyData.error || "Payment verification failed. If money was debited, your order will be confirmed automatically.");
          setIsProcessing(false);
        }
      };

      // Local development only: the server issues mock ids when ALLOW_MOCK_PAYMENTS is on.
      if (String(order.razorpayOrderId).startsWith("mock_rzp_")) {
        console.warn("Mock payment mode: simulating successful payment.");
        await handler({
          razorpay_order_id: order.razorpayOrderId,
          razorpay_payment_id: "pay_mock123",
          razorpay_signature: "mock_sig",
        });
        return;
      }

      if (typeof (window as any).Razorpay === "undefined") {
        toast.error("Payment window failed to load. Please check your connection or disable ad-blockers and try again.");
        setIsProcessing(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Spicy Nuts",
        description: "Dry fruits from Bidar",
        order_id: order.razorpayOrderId,
        handler,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#6e1a2c",
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      });
      rzp.on("payment.failed", function (response: any) {
        toast.error(response.error?.description || "Payment failed");
        setIsProcessing(false);
      });
      rzp.open();

    } catch (error: any) {
      toast.error(error.message || "Something went wrong during checkout.");
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) return null;

  const itemCount = items.reduce((a, b) => a + b.quantity, 0);
  const subtotal = quote?.subtotal ?? cartTotal;
  const freeAt = quote?.freeShippingThreshold ?? 0;
  const toFree = freeAt > 0 && shippingFee > 0 ? Math.max(0, freeAt - subtotal) : 0;
  const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lines = (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between text-white/75"><span>Subtotal · {itemCount} {itemCount === 1 ? "jar" : "jars"}</span><span className="tnum font-semibold text-white">{money(subtotal)}</span></div>
      {discount > 0 && <div className="flex justify-between font-semibold text-brand-gold"><span>Coupon {appliedCoupon}</span><span className="tnum">−{money(discount)}</span></div>}
      {pointsDiscount > 0 && <div className="flex justify-between font-semibold text-brand-gold"><span>Royal points</span><span className="tnum">−{money(pointsDiscount)}</span></div>}
      <div className="flex justify-between text-white/75"><span>Delivery</span>{!validPincode ? <span className="text-white/60">Enter your pincode</span> : shippingFee === 0 ? <span className="font-bold text-brand-gold">Free</span> : <span className="tnum font-semibold text-white">{money(shippingFee)}</span>}</div>
      {toFree > 0 && (
        <div className="pt-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><span className="journey-fill block h-full rounded-full bg-gradient-to-r from-[#b8893a] via-[#f6e2a8] to-[#e9c987]" style={{ width: `${Math.min(100, (subtotal / freeAt) * 100)}%` }} /></div>
          <p className="mt-1.5 text-xs text-white/70">Add {money(toFree)} more for free delivery.</p>
        </div>
      )}
      {quote?.error && <p className="text-xs font-semibold text-[#ffb4a6]">{quote.error}</p>}
    </div>
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <section className="jaali pt-header pb-8 text-white">
        <div className="container mx-auto max-w-6xl px-4 pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="eyebrow text-brand-gold">Spicy Nuts · Bidar</span>
              <h1 className="font-heading text-[40px] font-bold leading-none md:text-[54px]">Checkout</h1>
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/80"><Lock className="h-3.5 w-3.5 text-brand-gold" /> Payments are processed securely by Razorpay</p>
            </div>
            <Link href="/shop" className="hidden items-center gap-1 text-[13px] font-bold text-brand-gold hover:text-white sm:inline-flex">← Keep shopping</Link>
          </div>
          <CheckoutSteps current={1} />
        </div>
      </section>

      <div className="container mx-auto max-w-6xl min-h-[60vh] px-4 pb-16 pt-6">
        {!session ? (
          <div className="lux-card mb-6 flex flex-col justify-between gap-3 p-4 text-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 font-medium text-foreground">
              <span className="medallion h-8 w-8"><Sparkles className="h-4 w-4" /></span>
              <span>Checking out as a guest. Sign in to save your address and earn 5% back in Royal points.</span>
            </div>
            <Link href="/login?callbackUrl=/checkout" className="shrink-0">
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-brand-gold/50 text-xs font-bold">Sign in or register</Button>
            </Link>
          </div>
        ) : (
          <div className="lux-card mb-6 flex items-center gap-3 p-3.5 px-4 text-sm text-primary">
            <UserCheck className="h-5 w-5 shrink-0" />
            <span>Signed in as <strong>{session.user?.name || session.user?.email}</strong> · {userPoints} Royal points</span>
          </div>
        )}

        {/* phones: the order total folds open above the form */}
        <div className="mb-6 lg:hidden">
          <button type="button" onClick={() => setShowMobileSummary(!showMobileSummary)} aria-expanded={showMobileSummary} className="lux-dark flex w-full items-center justify-between p-4 text-sm">
            <span className="flex items-center gap-2 font-semibold"><ShoppingBag className="h-4 w-4 text-brand-gold" />{showMobileSummary ? "Hide" : "Show"} your order · {itemCount} {itemCount === 1 ? "jar" : "jars"}</span>
            <span className="flex items-center gap-2"><span className="tnum font-heading text-xl font-bold text-brand-gold">{money(total)}</span>{showMobileSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
          </button>
          {showMobileSummary && (
            <div className="lux-dark mt-2 space-y-4 p-4 animate-in fade-in slide-in-from-top-2">
              <div className="max-h-60 divide-y divide-white/10 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.weight}`} className="flex items-center gap-3 py-2.5">
                    <Image width={96} height={96} src={getCleanProductImage(item.image, item.name)} alt={item.name} className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-brand-gold/50" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="text-xs text-white/65">{item.weight} × {item.quantity}</p></div>
                    <span className="tnum text-sm font-semibold">{money(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {lines}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <form onSubmit={handleOrderSubmission} className="space-y-6 lg:col-span-7">
            {/* 1. delivery details */}
            <section className="lux-card space-y-5 p-5 sm:p-7" aria-labelledby="ship-h">
              <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="medallion">1</span>
                  <div>
                    <h2 id="ship-h" className="font-heading text-[28px] font-bold leading-none text-primary">Where should we send it?</h2>
                    <p className="mt-1 text-xs text-muted-foreground">We pack in Bidar and hand over to the courier within 1–2 working days.</p>
                  </div>
                </div>
                <AddressMapSelector onSelectAddress={(data) => { setFormData((prev) => ({ ...prev, address: data.address, city: data.city, state: data.state, pincode: data.pincode })); }} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="name" className="text-xs font-bold">Full name</Label><Input id="name" name="name" autoComplete="name" required value={formData.name} onChange={handleInputChange} placeholder="Rahul Sharma" className="lux-input" /></div>
                <div className="space-y-1.5"><Label htmlFor="phone" className="text-xs font-bold">Mobile number <span className="font-medium text-muted-foreground">(for courier updates)</span></Label><Input id="phone" name="phone" type="tel" autoComplete="tel" required value={formData.phone} onChange={handleInputChange} placeholder="10-digit mobile" className="lux-input" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="email" className="text-xs font-bold">Email <span className="font-medium text-muted-foreground">(receipt and GST invoice)</span></Label><Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleInputChange} placeholder="you@example.com" className="lux-input" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="address" className="text-xs font-bold">House, street and landmark</Label><Input id="address" name="address" autoComplete="street-address" required value={formData.address} onChange={handleInputChange} placeholder="Flat 402, Royal Palms, near the lake" className="lux-input" /></div>
                <div className="space-y-1.5"><Label htmlFor="city" className="text-xs font-bold">City</Label><Input id="city" name="city" autoComplete="address-level2" required value={formData.city} onChange={handleInputChange} placeholder="Bengaluru" className="lux-input" /></div>
                <div className="space-y-1.5"><Label htmlFor="state" className="text-xs font-bold">State</Label><Input id="state" name="state" autoComplete="address-level1" required value={formData.state} onChange={handleInputChange} placeholder="Karnataka" className="lux-input" /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-bold">Pincode</Label>
                  <Input id="pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} required value={formData.pincode} onChange={handleInputChange} placeholder="560001" className="lux-input tnum tracking-[0.2em]" />
                  {delivery && (
                    <p className={`flex items-center gap-1.5 text-xs font-semibold ${delivery.serviceable ? "text-success" : "text-destructive"}`}>
                      {delivery.serviceable ? <Truck className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}{delivery.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 2. payment */}
            <section className="lux-card space-y-4 p-5 sm:p-7" aria-labelledby="pay-h">
              <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                <span className="medallion">2</span>
                <div>
                  <h2 id="pay-h" className="font-heading text-[28px] font-bold leading-none text-primary">How would you like to pay?</h2>
                  <p className="mt-1 text-xs text-muted-foreground">UPI, cards and netbanking through Razorpay, or cash when it arrives.</p>
                </div>
              </div>
              <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label data-on={paymentMethod === "razorpay"} className="lux-choice flex cursor-pointer flex-col gap-2 p-4">
                  <input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} className="sr-only" />
                  <span className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Smartphone className="h-5 w-5" /></span><span className="radio-dot" /></span>
                  <span className="text-[15px] font-extrabold text-foreground">Pay online</span>
                  <span className="flex flex-wrap gap-1.5">{["UPI", "GPay", "PhonePe", "Cards", "Netbanking"].map((t) => <span key={t} className="rounded-full border border-border bg-white/70 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{t}</span>)}</span>
                </label>
                <label data-on={paymentMethod === "cod"} data-off={codBlocked} className={`lux-choice flex flex-col gap-2 p-4 ${codBlocked ? "" : "cursor-pointer"}`}>
                  <input type="radio" name="paymentMethod" value="cod" disabled={codBlocked} checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="sr-only" />
                  <span className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/15 text-brand-gold-deep"><Banknote className="h-5 w-5" /></span><span className="radio-dot" /></span>
                  <span className="text-[15px] font-extrabold text-foreground">Cash on delivery</span>
                  <span className="text-xs text-muted-foreground">{codBlocked ? "Not available for this pincode or order value" : "Pay in cash or UPI when the parcel reaches you"}</span>
                </label>
              </div>
            </section>

            <div className="space-y-4">
              <Button type="submit" disabled={isProcessing || !quoteReady || notServiceable} variant="buy" className="shine h-14 w-full rounded-2xl text-base font-extrabold">
                <Lock className="h-4 w-4" />
                {isProcessing ? "Placing your order…" : paymentMethod === "cod" ? `Place order · pay ${money(total)} on delivery` : `Pay ${money(total)} securely`}
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secured by Razorpay</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> FSSAI Reg. 21224035000151</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"><Package className="h-3.5 w-3.5 text-primary" /> Packed in Bidar, Karnataka</span>
              </div>
              <p className="text-center text-xs leading-snug text-muted-foreground">
                Your name, phone, email and address are used only to deliver this order, issue its GST invoice and send order updates (including on WhatsApp): one reminder if your payment doesn’t go through, and a request to rate the order after delivery.
                {" "}<a href="/privacy-policy" target="_blank" className="underline">Privacy Policy</a>
              </p>
            </div>
          </form>

          {/* order summary: maroon glass, sticky beside the form */}
          <aside className="sticky top-28 hidden lg:col-span-5 lg:block" aria-labelledby="sum-h">
            <div className="lux-dark space-y-5 p-6">
              <div className="flex items-baseline justify-between">
                <h2 id="sum-h" className="font-heading text-[30px] font-bold leading-none">Your order</h2>
                <span className="text-xs font-semibold text-white/65">{itemCount} {itemCount === 1 ? "jar" : "jars"}</span>
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.weight}`} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-white/10">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-brand-gold/60">
                      <Image width={112} height={112} src={getCleanProductImage(item.image, item.name)} alt={item.name} className="h-full w-full object-cover" />
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#f4a62a] px-1 text-[11px] font-extrabold text-[#3a0a12]">{item.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1"><h3 className="line-clamp-1 text-sm font-bold">{item.name}</h3><p className="text-xs text-white/65">{item.weight} · {money(item.price)} each</p></div>
                    <div className="tnum text-sm font-bold">{money(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-white/15 pt-4">
                <Label htmlFor="coupon" className="flex items-center gap-1.5 text-xs font-bold text-white/85"><Tag className="h-3.5 w-3.5 text-brand-gold" /> Coupon or gift code</Label>
                <div className="flex gap-2">
                  <Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="ROYAL10" className="lux-glass h-11 rounded-xl border-white/25 font-mono text-sm uppercase text-white placeholder:text-white/40" />
                  <Button type="button" variant="outline" onClick={applyCoupon} className="h-11 rounded-xl border-brand-gold/60 bg-transparent px-5 text-xs font-bold text-brand-gold hover:bg-white/10 hover:text-white">Apply</Button>
                </div>
              </div>
              {session && userPoints > 0 && (
                <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-white/15 pt-4">
                  <span className="flex flex-col"><span className="text-sm font-bold">Use Royal points</span><span className="text-xs text-white/65">{userPoints} points · worth {money(userPoints / 10)}</span></span>
                  <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="h-5 w-5 cursor-pointer accent-[#f4a62a]" />
                </label>
              )}
              <div className="border-t border-white/15 pt-4">{lines}</div>
              <div className="flex items-end justify-between border-t border-white/15 pt-4">
                <span className="font-heading text-2xl font-bold">Total</span>
                <span className="text-right"><span className="tnum foil-text block font-heading text-[40px] font-bold leading-none">{money(total)}</span>{quoteReady && (quote?.taxAmount ?? 0) > 0 && <span className="text-xs text-white/60">incl. GST {money(quote!.taxAmount!)}</span>}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
