"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck, RefreshCw, IndianRupee, History, ExternalLink, Ban, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS, nextAdminStatuses, type OrderStatus } from "@/lib/order-status-rules";
import { SHIPMENT_STATUSES, SHIPMENT_STATUS_LABELS, type ShipmentStatus } from "@/lib/shipping/status";
import { updateOrderStatusAction, addOrderNoteAction } from "@/app/actions/admin-orders";
import {
  bookShipmentAction,
  getCourierOptionsAction,
  syncShipmentAction,
  setShipmentStatusAction,
  cancelShipmentAction,
  issueRefundAction,
  markRefundPaidAction,
} from "@/app/actions/admin-shipping";

type Provider = { id: string; name: string; capabilities: { autoBooking: boolean; tracking: boolean; serviceability: boolean; cancel: boolean } };

const input = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm";
const card = "p-6 rounded-2xl bg-white border border-border/50 shadow-sm space-y-4";

export function FulfilmentPanel({
  order,
  providers,
  defaultProvider,
  pickupConfigured,
  estimatedWeightGrams,
  refundable,
}: {
  order: any;
  providers: Provider[];
  defaultProvider: string;
  pickupConfigured: boolean;
  estimatedWeightGrams: number;
  refundable: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<any>, ok: string) => {
    setBusy(key);
    try {
      const res = await fn();
      if (res && "error" in res) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
      return res;
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  // ---- status ----
  const [statusReason, setStatusReason] = useState("");
  const nextStatuses = nextAdminStatuses(order.status);

  // ---- shipment ----
  const active = order.shipments.find((s: any) => s.type === "FORWARD" && s.status !== "CANCELLED");
  const activeProvider = providers.find((p) => p.id === active?.provider);
  const canBook = !active && ["PROCESSING", "CONFIRMED"].includes(order.status);
  const [providerId, setProviderId] = useState(providers.some((p) => p.id === defaultProvider) ? defaultProvider : "MANUAL");
  const [weight, setWeight] = useState(String(estimatedWeightGrams));
  const [options, setOptions] = useState<Array<{ id: string; name: string; charge?: number }>>([]);
  const [courierId, setCourierId] = useState("");
  const [manual, setManual] = useState({ courierName: "", awb: "", trackingUrl: "" });
  const [manualStatus, setManualStatus] = useState<ShipmentStatus>("DELIVERED");
  const selected = providers.find((p) => p.id === providerId);

  // ---- refunds / notes ----
  const [refundAmount, setRefundAmount] = useState(refundable.toFixed(2));
  const [refundReason, setRefundReason] = useState("");
  const [refundRef, setRefundRef] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  return (
    <div className="space-y-6">
      {/* STATUS */}
      <div className={card}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-heading font-bold text-lg">Status</h2>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {order.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid"} · {order.paidAt || order.paymentId ? "Paid" : "Not paid yet"}
          {order.refundedAmount > 0 && ` · Refunded ₹${order.refundedAmount.toFixed(2)}`}
        </p>
        {nextStatuses.length > 0 ? (
          <div className="space-y-2">
            <input value={statusReason} onChange={(e) => setStatusReason(e.target.value)} placeholder="Reason / note (shown in history)" className={input} />
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((st) => (
                <Button
                  key={st}
                  size="sm"
                  variant={st === "CANCELLED" || st === "RTO" ? "outline" : "default"}
                  className={st === "CANCELLED" || st === "RTO" ? "text-red-600" : ""}
                  disabled={!!busy}
                  onClick={() => run(`status-${st}`, () => updateOrderStatusAction(order.id, st, statusReason), `Order → ${ORDER_STATUS_LABELS[st]}`)}
                >
                  {busy === `status-${st}` && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Mark {ORDER_STATUS_LABELS[st]}
                </Button>
              ))}
            </div>
            {nextStatuses.includes("CANCELLED") && order.paymentId && (
              <p className="text-xs text-muted-foreground">Cancelling refunds the online payment automatically and returns stock.</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No manual status changes available from here.</p>
        )}
      </div>

      {/* SHIPMENT */}
      <div className={card}>
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><Truck className="w-5 h-5" /> Delivery</h2>

        {active ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-muted-foreground text-xs">Courier</p><p className="font-medium">{active.courierName} <span className="text-xs text-muted-foreground">({active.provider})</span></p></div>
              <div><p className="text-muted-foreground text-xs">AWB</p><p className="font-mono">{active.awb || "—"}</p></div>
              <div><p className="text-muted-foreground text-xs">Status</p><p className="font-medium">{SHIPMENT_STATUS_LABELS[active.status as ShipmentStatus] ?? active.status}</p></div>
              <div><p className="text-muted-foreground text-xs">Weight</p><p>{active.weightGrams ? `${active.weightGrams} g` : "—"}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {active.trackingUrl && (
                <a href={active.trackingUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><ExternalLink className="w-4 h-4 mr-1" /> Track</Button></a>
              )}
              {active.labelUrl && (
                <a href={active.labelUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><FileDown className="w-4 h-4 mr-1" /> Shipping Label</Button></a>
              )}
              {activeProvider?.capabilities.tracking && (
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("sync", () => syncShipmentAction(active.id), "Tracking updated")}>
                  {busy === "sync" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Sync tracking
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-red-600" disabled={!!busy} onClick={() => run("cancel-ship", () => cancelShipmentAction(active.id), "Shipment cancelled")}>
                <Ban className="w-4 h-4 mr-1" /> Cancel shipment
              </Button>
            </div>
            {!activeProvider?.capabilities.tracking && (
              <div className="flex gap-2 items-center pt-2 border-t">
                <select value={manualStatus} onChange={(e) => setManualStatus(e.target.value as ShipmentStatus)} className={input}>
                  {SHIPMENT_STATUSES.filter((s) => s !== "CREATED").map((s) => (
                    <option key={s} value={s}>{SHIPMENT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <Button size="sm" disabled={!!busy} onClick={() => run("manual-status", () => setShipmentStatusAction(active.id, manualStatus), "Shipment updated")}>
                  Update
                </Button>
              </div>
            )}
          </div>
        ) : canBook ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Delivery partner</span>
                <select value={providerId} onChange={(e) => { setProviderId(e.target.value); setOptions([]); setCourierId(""); }} className={input}>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Packed weight (g)</span>
                <input type="number" min={50} value={weight} onChange={(e) => setWeight(e.target.value)} className={input} />
              </label>
            </div>

            {selected?.capabilities.autoBooking ? (
              <>
                {!pickupConfigured && <p className="text-xs text-red-600">Set your pickup address in Settings → Shipping before booking.</p>}
                {selected.capabilities.serviceability && (
                  <div className="flex gap-2 items-end">
                    <Button size="sm" variant="outline" disabled={!!busy} onClick={async () => {
                      setBusy("rates");
                      const res: any = await getCourierOptionsAction(order.id, providerId, Number(weight));
                      setBusy(null);
                      if (res.error) return toast.error(res.error);
                      setOptions(res.options);
                      setCourierId(res.options[0]?.id ?? "");
                    }}>
                      {busy === "rates" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Get rates
                    </Button>
                    {options.length > 0 && (
                      <select value={courierId} onChange={(e) => setCourierId(e.target.value)} className={input}>
                        {options.map((o) => <option key={o.id} value={o.id}>{o.name}{o.charge !== undefined ? ` — ₹${o.charge}` : ""}</option>)}
                      </select>
                    )}
                  </div>
                )}
                <Button disabled={!!busy || !pickupConfigured} onClick={() => run("book", () => bookShipmentAction(order.id, { providerId, courierId: courierId || undefined, weightGrams: Number(weight) }), "Shipment booked — pickup requested")}>
                  {busy === "book" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Book with {selected.name}
                </Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input value={manual.courierName} onChange={(e) => setManual({ ...manual, courierName: e.target.value })} placeholder="Courier (e.g. Xpressbees, DTDC)" className={input} />
                  <input value={manual.awb} onChange={(e) => setManual({ ...manual, awb: e.target.value })} placeholder="AWB / tracking number" className={input} />
                </div>
                <input value={manual.trackingUrl} onChange={(e) => setManual({ ...manual, trackingUrl: e.target.value })} placeholder="Tracking link (optional)" className={input} />
                <Button disabled={!!busy || !manual.courierName.trim()} onClick={() => run("book", () => bookShipmentAction(order.id, { providerId: "MANUAL", weightGrams: Number(weight), manual }), "Shipment saved — order marked shipped")}>
                  {busy === "book" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save & mark shipped
                </Button>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {order.status === "PENDING" ? "Waiting for payment before shipping." : "No active shipment."}
          </p>
        )}

        {order.shipments.filter((s: any) => s.id !== active?.id).length > 0 && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Previous: {order.shipments.filter((s: any) => s.id !== active?.id).map((s: any) => `${s.courierName} ${s.awb || ""} (${SHIPMENT_STATUS_LABELS[s.status as ShipmentStatus] ?? s.status})`).join(", ")}
          </p>
        )}
      </div>

      {/* REFUNDS */}
      <div className={card}>
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><IndianRupee className="w-5 h-5" /> Refunds</h2>
        {order.refunds.length === 0 && <p className="text-sm text-muted-foreground">No refunds.</p>}
        {order.refunds.map((r: any) => (
          <div key={r.id} className="text-sm border-b last:border-0 pb-2 space-y-1">
            <div className="flex justify-between">
              <span>₹{r.amount.toFixed(2)} · {r.method === "RAZORPAY" ? "Razorpay" : "Manual (UPI/bank)"}</span>
              <span className={r.status === "PROCESSED" ? "text-emerald-600" : r.status === "FAILED" ? "text-red-600" : "text-amber-600"}>{r.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">{r.reason}{r.reference ? ` · Ref ${r.reference}` : ""}</p>
            {r.method === "MANUAL" && r.status === "PENDING" && (
              <div className="flex gap-2">
                <input value={refundRef[r.id] ?? ""} onChange={(e) => setRefundRef({ ...refundRef, [r.id]: e.target.value })} placeholder="UPI / UTR reference" className={input} />
                <Button size="sm" disabled={!!busy} onClick={() => run(`paid-${r.id}`, () => markRefundPaidAction(r.id, refundRef[r.id] ?? ""), "Refund marked paid")}>Mark paid</Button>
              </div>
            )}
          </div>
        ))}
        {refundable > 0 ? (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">Refundable: ₹{refundable.toFixed(2)} {order.paymentMethod === "COD" ? "(COD — you pay the customer manually)" : "(goes back via Razorpay)"}</p>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" step="0.01" min="0.01" max={refundable} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className={input} />
              <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason" className={`${input} col-span-2`} />
            </div>
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("refund", () => issueRefundAction(order.id, Number(refundAmount), refundReason), "Refund issued")}>
              {busy === "refund" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Issue refund
            </Button>
          </div>
        ) : null}
      </div>

      {/* HISTORY */}
      <div className={card}>
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><History className="w-5 h-5" /> History</h2>
        <div className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note" className={input} />
          <Button size="sm" variant="outline" disabled={!!busy || !note.trim()} onClick={async () => { const r = await run("note", () => addOrderNoteAction(order.id, note), "Note added"); if (r && !("error" in r)) setNote(""); }}>Add</Button>
        </div>
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {order.events.length === 0 && <li className="text-sm text-muted-foreground">No history yet (older orders start their history from now).</li>}
          {order.events.map((ev: any) => (
            <li key={ev.id} className="text-sm border-l-2 border-primary/30 pl-3">
              <p>{ev.message}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(ev.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {ev.actor}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
