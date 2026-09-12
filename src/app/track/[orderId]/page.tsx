import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, Truck, CheckCircle2, Clock, XCircle, ArrowLeft, MapPin } from "lucide-react";

export const metadata = {
  title: "Track Order",
};

const statusSteps = [
  { key: "PENDING", label: "Order Placed", icon: Clock, color: "text-yellow-600" },
  { key: "PROCESSING", label: "Processing", icon: Package, color: "text-blue-600" },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "SHIPPED", label: "Shipped", icon: Truck, color: "text-purple-600" },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2, color: "text-green-600" },
];

const statusOrder: Record<string, number> = {
  PENDING: 0,
  PROCESSING: 1,
  CONFIRMED: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

export default async function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order || order.status === "DELETED") {
    notFound();
  }

  const isCancelled = order.status === "CANCELLED";
  const currentStep = statusOrder[order.status] ?? 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 pt-28 md:pt-36">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-heading font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Placed on {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold tnum">₹{order.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Status Timeline */}
          {isCancelled ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <XCircle className="w-6 h-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Order Cancelled</p>
                <p className="text-sm text-muted-foreground">This order has been cancelled. If you paid online, a refund will be processed within 5-7 business days.</p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="flex justify-between items-start">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                      {/* Connector line */}
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute top-5 left-1/2 w-full h-0.5 ${
                            index < currentStep ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                      {/* Step circle */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent
                            ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg"
                            : isCompleted
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span
                        className={`mt-2 text-xs text-center font-medium ${
                          isCurrent ? "text-foreground" : isCompleted ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tracking Info */}
        {order.trackingNumber && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Tracking Details
            </h2>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tracking Number</p>
                <p className="font-mono font-semibold">{order.trackingNumber}</p>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Track Package →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Shipping Address */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Shipping Address
          </h2>
          <p className="text-muted-foreground">{order.shippingAddress}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {order.customerName} · {order.customerPhone}
          </p>
        </div>

        {/* Order Items */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Order Items</h2>
          <div className="divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{item.product?.name || (item as any).productName || "Product"}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.weight} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold tnum">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 mt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg tnum">₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
