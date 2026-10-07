'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
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
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  Sparkles,
  ShoppingBag,
  Tag
} from "lucide-react";

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
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

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
  
  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      router.push("/shop");
    }
  }, [items, router, isProcessing]);

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
          orderNumber: `NW-${order.orderId.slice(-8).toUpperCase()}`,
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
        description: "Pure, Natural, Organic Gourmet Spices & Dry Fruits",
        order_id: order.razorpayOrderId,
        handler,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#052c1e",
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

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <section className="jaali pt-header pb-6 text-white">
        <div className="container mx-auto max-w-6xl px-4 pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="eyebrow text-brand-gold">Secure checkout</span>
              <h1 className="font-heading text-[34px] font-bold leading-none md:text-[46px]">Secure Checkout</h1>
              <p className="mt-1.5 text-[13px] text-white/80">Complete your order with single-estate harvest freshness</p>
            </div>
            <Link href="/shop" className="hidden items-center gap-1 text-[13px] font-bold text-brand-gold hover:text-white sm:inline-flex">
              ← Continue Shopping
            </Link>
          </div>
          <ol aria-label="Checkout steps" className="mt-4 grid grid-cols-3 gap-2">
            {[["Cart", true], ["Address", true], ["Payment", false]].map(([label, done]) => (
              <li key={label as string} className="flex flex-col gap-1.5">
                <span className={`h-1 rounded-full ${done ? "bg-brand-gold" : "bg-white/25"}`} />
                <span className={`font-royal text-[10.5px] font-bold tracking-[0.16em] ${done ? "text-brand-gold" : "text-white/70"}`}>{(label as string).toUpperCase()}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 pt-6 pb-16 min-h-[60vh]">
        {/* Guest vs Logged-in Banner */}
        {!session ? (
          <div className="mb-6 p-4 rounded-2xl bg-secondary/10 border border-brand-gold/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-brand-gold-deep dark:text-brand-gold font-medium">
              <Sparkles className="w-4 h-4 text-brand-gold-deep shrink-0" />
              <span>Ordering as a guest. Want to save your address & earn 5% Royal points?</span>
            </div>
            <Link href="/login?callbackUrl=/checkout">
              <Button variant="outline" size="sm" className="rounded-xl border-brand-gold/30 text-xs font-semibold h-8 shrink-0">
                Sign In / Register
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mb-6 p-3 px-4 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2.5 text-xs text-primary font-medium">
            <UserCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Signed in as <strong>{session.user?.name || session.user?.email}</strong>. Royal points balance: {userPoints} pts.</span>
          </div>
        )}

        {/* Mobile Collapsible Order Summary Bar */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="w-full p-4 royal-card flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2 font-medium">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>{showMobileSummary ? "Hide" : "View"} Order Summary ({items.reduce((a, b) => a + b.quantity, 0)} items)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary text-base">₹{total.toFixed(2)}</span>
              {showMobileSummary ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          {showMobileSummary && (
            <div className="p-4 mt-2 bg-card rounded-2xl border border-border/60 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="divide-y divide-border/40 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.weight}`} className="py-2.5 flex items-center gap-3">
                    <Image width={800} height={800} unoptimized={false} src={getCleanProductImage(item.image, item.name)} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-border/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.weight} × {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border/50 text-xs space-y-1.5 text-muted-foreground">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{(quote?.subtotal ?? cartTotal).toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-primary font-medium"><span>Promo Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
                {pointsDiscount > 0 && <div className="flex justify-between text-primary font-medium"><span>Points Redeemed</span><span>-₹{pointsDiscount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Delivery</span>{shippingFee === 0 ? <span className="text-primary font-semibold">FREE</span> : <span>₹{shippingFee.toFixed(2)}</span>}</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Main Checkout Form */}
          <form onSubmit={handleOrderSubmission} className="lg:col-span-7 space-y-6">
            
            {/* 1. Shipping Details Card */}
            <div className="royal-card p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-primary flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    Shipping Destination
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Where should we courier your fresh harvest?</p>
                </div>
                <AddressMapSelector 
                  onSelectAddress={(data) => {
                    setFormData((prev) => ({
                      ...prev,
                      address: data.address,
                      city: data.city,
                      state: data.state,
                      pincode: data.pincode
                    }));
                  }} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Full Name *</Label>
                  <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Rahul Sharma" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">Phone Number (for Courier SMS) *</Label>
                  <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleInputChange} placeholder="10-digit mobile number" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email" className="text-xs font-semibold">Email (for Order Receipt & Tax Invoice) *</Label>
                  <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} placeholder="your.name@example.com" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address" className="text-xs font-semibold">Street Address / House / Landmark *</Label>
                  <Input id="address" name="address" required value={formData.address} onChange={handleInputChange} placeholder="e.g. Flat 402, Royal Palms, Near Lake" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold">City *</Label>
                  <Input id="city" name="city" required value={formData.city} onChange={handleInputChange} placeholder="e.g. Bengaluru" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold">State *</Label>
                  <Input id="state" name="state" required value={formData.state} onChange={handleInputChange} placeholder="e.g. Karnataka" className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-semibold">Pincode (6-digits) *</Label>
                  <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} required value={formData.pincode} onChange={handleInputChange} placeholder="e.g. 560001" className="rounded-xl h-11" />
                  {delivery && (
                    <p className={`text-xs font-medium ${delivery.serviceable ? 'text-primary' : 'text-destructive'}`}>{delivery.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Payment Method Selector */}
            <div className="royal-card p-5 sm:p-6 space-y-4">
              <div className="border-b border-border/40 pb-3">
                <h2 className="font-heading text-2xl font-bold text-primary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  Payment Method
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select how you wish to settle this purchase</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Online Payment Option */}
                <label 
                  className={`relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 hover:border-primary/40 bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-primary bg-muted dark:bg-primary/40 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <span className="font-bold text-sm text-foreground">Online Payment</span>
                  <span className="text-xs text-muted-foreground mt-0.5">UPI (GPay / PhonePe), Cards & NetBanking</span>
                </label>

                {/* Cash on Delivery Option */}
                <label 
                  className={`relative flex flex-col p-4 rounded-2xl border-2 transition-all ${
                    codBlocked
                      ? 'border-border/40 bg-muted/30 opacity-60 cursor-not-allowed'
                      : paymentMethod === 'cod'
                      ? 'border-primary bg-primary/5 shadow-sm cursor-pointer'
                      : 'border-border/60 hover:border-primary/40 bg-card cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    disabled={codBlocked}
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-secondary/10 text-brand-gold-deep dark:text-brand-gold flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Zero Advance
                    </span>
                  </div>
                  <span className="font-bold text-sm text-foreground">Cash on Delivery (COD)</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {codBlocked ? 'Not available for this pincode / order value' : 'Pay in cash or UPI when package arrives at doorstep'}
                  </span>
                </label>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                disabled={isProcessing || !quoteReady || notServiceable} 
                className="w-full h-12 text-[15px] font-extrabold rounded-xl border border-brand-gold shadow-lg transition-all"
              >
                {isProcessing 
                  ? "Securing Order..." 
                  : paymentMethod === 'cod' 
                    ? `Confirm Cash on Delivery Order (₹${total.toFixed(2)})`
                    : `Proceed to Pay ₹${total.toFixed(2)}`
                }
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> 100% Secure Checkout</span>
                <span>•</span>
                <span>Direct Terroir Harvest</span>
                <span>•</span>
                <span>Insured Delivery</span>
              </div>
            </div>

          </form>

          {/* Desktop Sticky Order Summary Column */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="royal-card p-5 space-y-5">
              <h2 className="font-heading text-2xl font-bold text-primary flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-muted-foreground">({items.length} unique items)</span>
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-border/30 pr-1">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.weight}`} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                      <Image width={800} height={800} unoptimized={false} src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.weight} × {item.quantity}</p>
                    </div>
                    <div className="font-bold text-sm text-foreground">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="pt-4 border-t border-border/50 space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Promo or Gift Code
                </Label>
                <div className="flex gap-2">
                  <Input 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)} 
                    placeholder="e.g. ROYAL10" 
                    className="h-10 text-xs font-mono uppercase rounded-xl" 
                  />
                  <Button type="button" variant="outline" size="sm" onClick={applyCoupon} className="rounded-xl px-4 text-xs font-semibold">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Loyalty Points */}
              {session && userPoints > 0 && (
                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">Redeem Spice Points</span>
                    <span className="text-[11px] text-muted-foreground">{userPoints} pts available (worth ₹{(userPoints/10).toFixed(0)})</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={usePoints} 
                    onChange={e => setUsePoints(e.target.checked)} 
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              )}

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-border/50 space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Bag Subtotal</span>
                  <span className="font-medium text-foreground">₹{(quote?.subtotal ?? cartTotal).toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-primary text-xs font-medium">
                    <span>Promo Code Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-primary text-xs font-medium">
                    <span>Royal Points Redeemed</span>
                    <span>-₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Courier Shipping</span>
                  {shippingFee === 0 ? (
                    <span className="text-primary font-semibold">FREE</span>
                  ) : (
                    <span className="font-medium text-foreground">₹{shippingFee.toFixed(2)}</span>
                  )}
                </div>

                {shippingFee > 0 && quote?.freeShippingThreshold ? (
                  <p className="text-[11px] text-muted-foreground">Free shipping on orders of ₹{quote.freeShippingThreshold} or more.</p>
                ) : null}

                {quote?.error && (
                  <p className="text-xs text-destructive font-medium">{quote.error}</p>
                )}

                <div className="border-t border-border/60 pt-3 flex justify-between font-bold text-base md:text-lg text-foreground">
                  <span>Grand Total</span>
                  <span className="text-primary text-xl">₹{total.toFixed(2)}</span>
                </div>
                {quoteReady && (quote?.taxAmount ?? 0) > 0 && (
                  <p className="text-[11px] text-muted-foreground text-right">Inclusive of GST (₹{quote!.taxAmount!.toFixed(2)})</p>
                )}
              </div>

              {/* Terroir / Eco Packaging Badge */}
              <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 text-primary dark:text-primary text-xs">
                <span className="text-lg">🌿</span>
                <div>
                  <p className="font-semibold">Single-Estate Provenance Insured</p>
                  <p className="opacity-80 mt-0.5">Packed in food-grade, nitrogen-flushed airtight jars to maintain peak farm aromas.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
