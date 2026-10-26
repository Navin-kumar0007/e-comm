import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { getStaffContext } from "@/lib/auth-guard";
import { SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/shipping/status";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, Truck, XCircle, ArrowLeft, MapPin, ExternalLink, MessageCircle } from "lucide-react";
import { DeliveryJourney, JOURNEY } from "@/components/storefront/royal/delivery-journey";

export const metadata = {
  title: "Track Order",
};

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
  // where the order is on its road: placed → packed in Bidar → with the courier → out for delivery → delivered
  const currentStep =
    order.status === "DELIVERED" ? JOURNEY.length
    : order.status === "SHIPPED" ? (shipment?.status === "OUT_FOR_DELIVERY" ? 3 : 2)
    : order.status === "PROCESSING" || order.status === "CONFIRMED" ? 1
    : 0;
  const placed = order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const nowLabel = isCancelled ? "Stopped" : currentStep >= JOURNEY.length ? "Delivered" : JOURNEY[currentStep].label;
  const steps = JOURNEY.map((st, i) => (i === 0 ? { ...st, note: placed } : st));

  return (
    <>
      <section className="jaali relative overflow-hidden pt-header pb-24 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_70%_at_85%_20%,rgba(244,166,42,0.22),transparent_70%)]" />
        <div className="relative container mx-auto max-w-4xl px-4 pt-6">
          <Link href="/track" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-gold hover:text-white"><ArrowLeft className="h-4 w-4" /> Track another order</Link>
          <span className="eyebrow block text-brand-gold">Order tracking</span>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-heading text-[40px] font-bold leading-[0.95] md:text-[56px]">Order <span className="font-mono text-[0.8em] tracking-wide">#{order.id.slice(-8).toUpperCase()}</span></h1>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold ${isCancelled ? "bg-[#ff7a66] text-[#3a0800]" : "lux-glass text-[#f6e2a8]"}`}>
              {!isCancelled && <span className="h-2 w-2 rounded-full bg-[#f6e2a8] shadow-[0_0_0_4px_rgba(246,226,168,0.25)]" />}{nowLabel}
            </span>
          </div>
          <p className="mt-2 text-[13.5px] text-white/80">Placed on {placed} · <span className="tnum">₹{order.total.toFixed(2)}</span></p>
        </div>
      </section>

      <div className="container relative mx-auto -mt-16 max-w-4xl px-4 pb-16">
        <div className="lux-card mb-6 p-5 sm:p-8">
          {isCancelled ? (
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"><XCircle className="h-6 w-6" /></span>
              <div>
                <p className="font-heading text-2xl font-bold text-destructive">
                  {{ EXPIRED: "Payment not completed", RTO: "Returned to us", RETURNED: "Order returned" }[order.status as string] ?? "Order cancelled"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.status === "EXPIRED"
                    ? "We didn't receive payment for this order, so it was released. No money was charged."
                    : order.status === "RTO"
                    ? "The courier couldn't deliver this order and returned it to us." + (order.paymentId ? " Your refund has been started." : "")
                    : order.status === "RETURNED"
                    ? "This order was returned and refunded."
                    : order.paymentId
                    ? "This order has been cancelled. Your refund will reach you in 5–7 working days."
                    : "This order has been cancelled."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mb-6 font-heading text-2xl font-bold text-primary">The road from Bidar to you</h2>
              <DeliveryJourney current={currentStep} steps={steps} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          {order.trackingNumber ? (
            <div className="lux-dark p-6 md:col-span-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="eyebrow text-brand-gold">{shipment?.courierName || "Courier"}</span>
                  <p className="mt-1 font-mono text-xl font-bold tracking-wide">{order.trackingNumber}</p>
                  {shipment && <p className="mt-1 text-sm font-semibold text-[#f6e2a8]">{SHIPMENT_STATUS_LABELS[shipment.status as ShipmentStatus] ?? shipment.status}</p>}
                </div>
                <span className="lux-glass grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-brand-gold"><Truck className="h-6 w-6" /></span>
              </div>
              {courierEvents.length > 0 && (
                <ol className="relative mt-5 space-y-4 pl-6 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-[2px] before:rounded-full before:bg-white/15">
                  {courierEvents.map((ev, i) => (
                    <li key={i} className="relative text-sm">
                      <span className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 ${i === 0 ? "border-[#f6e2a8] bg-[#f6e2a8] pulse-ring" : "border-brand-gold/60 bg-[#3a0a12]"}`} />
                      <span className="font-bold">{SHIPMENT_STATUS_LABELS[ev.status] ?? ev.status}</span>
                      {ev.location && <span className="text-white/70"> · {ev.location}</span>}
                      <span className="block text-xs text-white/55">{new Date(ev.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  ))}
                </ol>
              )}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-brand-gold/60 px-4 text-sm font-bold text-brand-gold hover:bg-white/10 hover:text-white">
                  Open on the courier&apos;s site <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ) : (
            <div className="lux-dark p-6 md:col-span-3">
              <span className="eyebrow text-brand-gold">Courier</span>
              <p className="mt-2 font-heading text-2xl font-bold">Tracking number coming soon</p>
              <p className="mt-1 text-sm text-white/75">As soon as your parcel is booked with the courier, its tracking number and live updates will appear here and in an SMS.</p>
            </div>
          )}

          <div className="lux-card p-6 md:col-span-2">
            <h2 className="mb-2 flex items-center gap-2 font-heading text-xl font-bold text-primary"><MapPin className="h-5 w-5" /> Delivering to</h2>
            <p className="text-sm text-foreground">{canSeeDetails ? order.shippingAddress : maskAddress(order.shippingAddress)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {canSeeDetails ? `${order.customerName} · ${order.customerPhone}` : `${order.customerName.split(" ")[0]} · ${maskPhone(order.customerPhone)}`}
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>Need help? WhatsApp <span className="tnum select-all font-bold text-foreground">+91 85500 07073</span></span></div>
          </div>
        </div>

        <div className="lux-card mt-6 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-primary"><Package className="h-5 w-5" /> In this parcel</h2>
          <div className="divide-y divide-border/60">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-heading text-lg font-bold text-primary">{item.quantity}</span>
                  <div className="min-w-0"><p className="truncate font-bold">{item.product?.name || (item as any).productName || "Product"}</p><p className="text-xs text-muted-foreground">{item.weight}</p></div>
                </div>
                <p className="tnum shrink-0 font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-end justify-between border-t border-border/60 pt-4">
            <span className="font-heading text-xl font-bold">Total</span>
            <span className="tnum font-heading text-3xl font-bold text-primary">₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
