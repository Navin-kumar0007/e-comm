import { prisma } from "@/lib/db/prisma";
import { PageHero } from "@/components/storefront/royal/page-hero";
import { auth } from "@/lib/auth";
import { getStaffContext } from "@/lib/auth-guard";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/shipping/status";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, Truck, CheckCircle2, Clock, XCircle, ArrowLeft, MapPin } from "lucide-react";

export const metadata = {
  title: "Track Order",
};

const statusSteps = [
  { key: "PENDING", label: "Order Placed", icon: Clock, color: "text-yellow-600" },
  { key: "PROCESSING", label: "Processing", icon: Package, color: "text-blue-600" },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, color: "text-primary" },
  { key: "SHIPPED", label: "Shipped", icon: Truck, color: "text-purple-600" },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2, color: "text-success" },
];

// Anyone with the tracking link can see this page, so personal details are
// masked unless the viewer is the signed-in owner or an admin.
function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `••••••${digits.slice(-4)}` : "••••";
}

function maskAddress(address: string) {
  // Stored as "street, city, state, pincode" — show only the last three parts.
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.slice(-3).join(", ");
}

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
      shipments: { where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order || order.status === "DELETED") {
    notFound();
  }

  const session = await auth();
  const canSeeDetails =
    !!session?.user &&
    ((!!order.userId && order.userId === (session.user as any).id) || !!(await getStaffContext())?.can("orders.view"));

  const isCancelled = ["CANCELLED", "EXPIRED", "RTO", "RETURNED"].includes(order.status);
  const shipment = order.shipments[0];
  let courierEvents: Array<{ at: string; status: ShipmentStatus; location?: string; message?: string }> = [];
  try {
    courierEvents = shipment ? JSON.parse(shipment.events || "[]").slice(-6).reverse() : [];
  } catch {}
  const currentStep = statusOrder[order.status] ?? 0;

  return (
    <>
    <PageHero eyebrow="Order tracking" title={`Order #${order.id.slice(-8).toUpperCase()}`} subtitle={`Placed on ${order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`} compact />
    <div className="min-h-[60vh] bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Store
        </Link>

        <div className="royal-card p-5 sm:p-7 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary">Order #{order.id.slice(-8).toUpperCase()}</h2>
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
                <p className="font-semibold text-destructive">
                  {{ EXPIRED: "Payment Not Completed", RTO: "Returned to Sender", RETURNED: "Order Returned" }[order.status as string] ?? "Order Cancelled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.status === "EXPIRED"
                    ? "We didn't receive payment for this order, so it was released. No money was charged."
                    : order.status === "RTO"
                    ? "The courier couldn't deliver this order and returned it to us." + (order.paymentId ? " Your refund has been initiated." : "")
                    : order.status === "RETURNED"
                    ? "This order was returned and refunded."
                    : order.paymentId
                    ? "This order has been cancelled. Your refund will be processed within 5-7 business days."
                    : "This order has been cancelled."}
                </p>
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
                <p className="text-sm text-muted-foreground">{shipment?.courierName || "Tracking Number"}</p>
                <p className="font-mono font-semibold">{order.trackingNumber}</p>
                {shipment && (
                  <p className="text-sm text-primary font-medium mt-1">
                    {SHIPMENT_STATUS_LABELS[shipment.status as ShipmentStatus] ?? shipment.status}
                  </p>
                )}
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
            {courierEvents.length > 0 && (
              <ul className="mt-4 space-y-2 border-l-2 border-primary/20 pl-4">
                {courierEvents.map((ev, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{SHIPMENT_STATUS_LABELS[ev.status] ?? ev.status}</span>
                    {ev.location && <span className="text-muted-foreground"> · {ev.location}</span>}
                    <span className="block text-xs text-muted-foreground">
                      {new Date(ev.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Shipping Address */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Shipping Address
          </h2>
          <p className="text-muted-foreground">
            {canSeeDetails ? order.shippingAddress : maskAddress(order.shippingAddress)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {canSeeDetails
              ? `${order.customerName} · ${order.customerPhone}`
              : `${order.customerName.split(" ")[0]} · ${maskPhone(order.customerPhone)}`}
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
    </>
  );
}
