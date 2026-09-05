'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  
  // Mock user points for demo (in reality, fetch from DB or session)
  const pointsDiscount = usePoints ? Math.floor(userPoints / 10) : 0; // 10 points = 1 Rupee
  
  const total = Math.max(0, cartTotal - discount - pointsDiscount);

  const applyCoupon = async () => {
    if (!couponCode) return;
    const res = await validateCoupon(couponCode, cartTotal);
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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) return;

    setIsProcessing(true);
    
    try {
      // 1. Create order on our backend
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
          paymentMethod: 'razorpay',
          couponCode: couponCode,
          usePoints: usePoints,
        }),
      });
      const order = await res.json();

      if (order.error) throw new Error(order.error);

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mockedkey123", 
        amount: order.amount,
        currency: order.currency,
        name: "Nutty World",
        description: "Organic Groceries",
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify payment on our backend
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
            // Save order info for receipt display
            const subtotal = total / 1.05;
            const tax = total - subtotal;
            const orderConfirmationData = {
              orderNumber: verifyData.orderId || `MK-${Math.floor(100000 + Math.random() * 900000)}`,
              subtotal: subtotal,
              shipping: 0,
              tax: tax,
              total: total,
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
            toast.success("Payment Successful! Order placed.");
            router.push("/order-confirmation");
          } else {
            toast.error("Payment verification failed.");
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
        console.warn("Razorpay SDK not found, simulating successful payment for demo...");
        options.handler({
           razorpay_order_id: order.id,
           razorpay_payment_id: "pay_mock123",
           razorpay_signature: "mock_sig_456"
        });
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(response.error.description || "Payment failed");
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="container mx-auto max-w-6xl px-4 pt-32 pb-12 min-h-[70vh]">
        <h1 className="text-4xl font-heading font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <form onSubmit={handlePayment} className="space-y-8">
            <div className="p-6 bg-card rounded-2xl shadow-sm border border-border/50 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Shipping Information</h2>
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
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" required value={formData.phone} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" required value={formData.address} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" required value={formData.city} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" required value={formData.state} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" required value={formData.pincode} onChange={handleInputChange} className="rounded-xl" />
                </div>
              </div>
            </div>
            
            <Button type="submit" disabled={isProcessing} className="w-full h-14 text-lg rounded-xl shadow-lg">
              {isProcessing ? "Processing..." : `Pay ₹${total.toFixed(2)} with Razorpay`}
            </Button>
          </form>

          {/* Order Summary */}
          <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 h-fit sticky top-32">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.productId}-${item.weight}`} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-background border border-border overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.weight} x {item.quantity}</p>
                  </div>
                  <div className="font-semibold text-sm">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              
              {/* Promo Code UI */}
              <div className="pt-4 border-t border-border space-y-2">
                <Label>Promo Code</Label>
                <div className="flex gap-2">
                  <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter code" className="h-9 text-sm" />
                  <Button type="button" variant="outline" size="sm" onClick={applyCoupon}>Apply</Button>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium pt-2">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Loyalty Points UI */}
              {session && userPoints > 0 && (
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">Use Loyalty Points</span>
                    <span className="text-xs text-muted-foreground">You have {userPoints} points (₹{(userPoints/10).toFixed(2)})</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={usePoints} 
                    onChange={e => setUsePoints(e.target.checked)} 
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                  />
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Points Redeemed</span>
                  <span>-₹{pointsDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-xl border border-green-100 dark:border-green-900 mt-6 flex items-start gap-3 text-green-800 dark:text-green-300">
              <div className="text-2xl mt-1">🌱</div>
              <div>
                <h4 className="font-semibold text-sm">Eco-Impact Tracker</h4>
                <p className="text-xs mt-1">By choosing our organic products in sustainable packaging, you're saving an estimated <strong>{(items.reduce((a: any, c: any) => a + c.quantity, 0) * 0.4).toFixed(1)}kg of CO₂</strong> compared to standard grocery items.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
