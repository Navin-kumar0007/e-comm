'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Script from "next/script";
import { validateCoupon } from "@/app/actions/coupons";
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
  const [discount, setDiscount] = useState(0);
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
  
  const pointsDiscount = usePoints ? Math.floor(userPoints / 10) : 0; // 10 points = 1 Rupee
  const total = Math.max(0, cartTotal - discount - pointsDiscount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await validateCoupon(couponCode.trim().toUpperCase(), cartTotal);
    if (res.error) {
      toast.error(res.error);
      setDiscount(0);
    } else if (res.coupon) {
      toast.success("Coupon applied!");
      if (res.coupon.discountType === 'PERCENTAGE') {
        setDiscount(cartTotal * (res.coupon.discountValue / 100));
      } else {
        setDiscount(res.coupon.discountValue);
      }
    }
  };
  
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
    if (total <= 0 && items.length === 0) return;

    // Validate phone number format (at least 10 digits)
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Create order on backend
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            slug: item.slug,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            weight: item.weight,
            image: item.image,
          })),
          shippingDetails: formData,
          paymentMethod: paymentMethod,
          couponCode: couponCode,
          usePoints: usePoints,
        }),
      });
      const order = await res.json();

      if (order.error) throw new Error(order.error);

      // 2. Handle Cash on Delivery (COD) Direct Flow
      if (paymentMethod === 'cod') {
        const subtotal = total / 1.05;
        const tax = total - subtotal;
        const orderConfirmationData = {
          orderNumber: order.orderId ? `NW-${order.orderId.slice(-8).toUpperCase()}` : `NW-${Math.floor(100000 + Math.random() * 900000)}`,
          orderId: order.orderId,
          subtotal: subtotal,
          shipping: 0,
          tax: tax,
          total: total,
          paymentMethod: 'Cash on Delivery (COD)',
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
        };
        sessionStorage.setItem('lastOrder', JSON.stringify(orderConfirmationData));

        clearCart();
        toast.success("Order Placed Successfully!");
        router.push("/order-confirmation");
        return;
      }

      // 3. Handle Razorpay Online Payment Flow
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mockedkey123", 
        amount: order.amount,
        currency: "INR",
        name: "Spicy Nuts",
        description: "Pure, Natural, Organic Gourmet Spices & Dry Fruits",
        order_id: order.razorpayOrderId || order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || "mock_signature",
              orderId: order.orderId,
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            const subtotal = total / 1.05;
            const tax = total - subtotal;
            const orderConfirmationData = {
              orderNumber: order.orderId ? `NW-${order.orderId.slice(-8).toUpperCase()}` : `NW-${Math.floor(100000 + Math.random() * 900000)}`,
              orderId: order.orderId,
              subtotal: subtotal,
              shipping: 0,
              tax: tax,
              total: total,
              paymentMethod: 'Online Payment (Prepaid)',
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
            };
            sessionStorage.setItem('lastOrder', JSON.stringify(orderConfirmationData));

            clearCart();
            toast.success("Payment Successful! Order confirmed.");
            router.push("/order-confirmation");
          } else {
            toast.error("Payment verification failed.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#052c1e",
        },
      };

      if (typeof (window as any).Razorpay === "undefined" || options.key === "rzp_test_mockedkey123") {
        console.warn("Razorpay SDK not configured, simulating successful test payment...");
        options.handler({
           razorpay_order_id: order.razorpayOrderId || "mock_rzp_" + order.orderId,
           razorpay_payment_id: "pay_mock123",
           razorpay_signature: "mock_sig_456"
        });
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(response.error?.description || "Payment failed");
          setIsProcessing(false);
        });
        rzp.open();
      }

    } catch (error: any) {
      toast.error(error.message || "Something went wrong during checkout.");
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="container mx-auto max-w-6xl px-4 pt-28 pb-16 min-h-[75vh]">
        
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Secure Checkout</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete your order with single-estate harvest freshness</p>
          </div>
          <Link href="/shop" className="text-sm text-primary hover:underline hidden sm:inline-flex items-center gap-1">
            ← Continue Shopping
          </Link>
        </div>

        {/* Guest vs Logged-in Banner */}
        {!session ? (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ordering as a guest. Want to save your address & earn 5% Royal points?</span>
            </div>
            <Link href="/login?callbackUrl=/checkout">
              <Button variant="outline" size="sm" className="rounded-xl border-amber-500/30 text-xs font-semibold h-8 shrink-0">
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
            className="w-full p-4 rounded-2xl bg-card border border-border/60 flex items-center justify-between shadow-sm text-sm"
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
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-border/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.weight} × {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border/50 text-xs space-y-1.5 text-muted-foreground">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Promo Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
                {pointsDiscount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Points Redeemed</span><span>-₹{pointsDiscount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Delivery</span><span className="text-emerald-600 font-semibold">FREE</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Main Checkout Form */}
          <form onSubmit={handleOrderSubmission} className="lg:col-span-7 space-y-6">
            
            {/* 1. Shipping Details Card */}
            <div className="p-6 sm:p-7 bg-card rounded-3xl shadow-sm border border-border/60 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div>
                  <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
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
                  <Input id="pincode" name="pincode" maxLength={6} required value={formData.pincode} onChange={handleInputChange} placeholder="e.g. 560001" className="rounded-xl h-11" />
                </div>
              </div>
            </div>

            {/* 2. Payment Method Selector */}
            <div className="p-6 sm:p-7 bg-card rounded-3xl shadow-sm border border-border/60 space-y-4">
              <div className="border-b border-border/40 pb-3">
                <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
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
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <span className="font-bold text-sm text-foreground">Online Payment</span>
                  <span className="text-xs text-muted-foreground mt-0.5">UPI (GPay / PhonePe), Cards & NetBanking</span>
                </label>

                {/* Cash on Delivery Option */}
                <label 
                  className={`relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/60 hover:border-primary/40 bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Zero Advance
                    </span>
                  </div>
                  <span className="font-bold text-sm text-foreground">Cash on Delivery (COD)</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Pay in cash or UPI when package arrives at doorstep</span>
                </label>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                disabled={isProcessing} 
                className="w-full h-14 text-base md:text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/25 transition-all"
              >
                {isProcessing 
                  ? "Securing Order..." 
                  : paymentMethod === 'cod' 
                    ? `Confirm Cash on Delivery Order (₹${total.toFixed(2)})`
                    : `Proceed to Pay ₹${total.toFixed(2)}`
                }
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Secure Checkout</span>
                <span>•</span>
                <span>Direct Terroir Harvest</span>
                <span>•</span>
                <span>Free Insured Delivery</span>
              </div>
            </div>

          </form>

          {/* Desktop Sticky Order Summary Column */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="p-6 bg-card rounded-3xl border border-border/60 shadow-sm space-y-5">
              <h2 className="text-lg font-heading font-bold text-foreground flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-muted-foreground">({items.length} unique items)</span>
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-border/30 pr-1">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.weight}`} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                  <span className="font-medium text-foreground">₹{cartTotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-xs font-medium">
                    <span>Promo Code Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}

                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-xs font-medium">
                    <span>Royal Points Redeemed</span>
                    <span>-₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Estimated Courier Shipping</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>

                <div className="border-t border-border/60 pt-3 flex justify-between font-bold text-base md:text-lg text-foreground">
                  <span>Grand Total</span>
                  <span className="text-primary text-xl">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Terroir / Eco Packaging Badge */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs">
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
