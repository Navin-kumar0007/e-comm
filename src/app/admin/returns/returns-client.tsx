"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RETURN_REASONS } from "@/lib/order-status-rules";
import { decideReturnAction, resolveReturnAction } from "@/app/actions/admin-returns";

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  RESOLVED: "bg-green-100 text-green-700",
};

export function ReturnsClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"OPEN" | "ALL">("OPEN");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const list = filter === "OPEN" ? requests.filter((r) => ["REQUESTED", "APPROVED"].includes(r.status)) : requests;

  const act = async (key: string, fn: () => Promise<any>, ok: string) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (res && "error" in res) return toast.error(res.error);
    toast.success(ok);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Returns</h1>
          <p className="text-muted-foreground mt-1">Damaged / wrong / missing item reports from customers</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          {(["OPEN", "ALL"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}>
              {f === "OPEN" ? `Open (${requests.filter((r) => ["REQUESTED", "APPROVED"].includes(r.status)).length})` : "All"}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && <p className="text-muted-foreground p-6 rounded-2xl bg-card border">No return requests.</p>}

      {list.map((r) => (
        <div key={r.id} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href={`/admin/orders/${r.order.id}`} className="font-semibold text-primary hover:underline">
                Order #{r.order.id.slice(-8).toUpperCase()}
              </Link>
              <p className="text-sm text-muted-foreground">
                {r.order.customerName} · {r.order.customerPhone} · ₹{r.order.total.toFixed(2)} · {r.order.paymentMethod}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString("en-IN")}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status] ?? ""}`}>{r.status}</span>
          </div>

          <div className="text-sm">
            <p className="font-medium">{RETURN_REASONS[r.reason as keyof typeof RETURN_REASONS] ?? r.reason}</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{r.details}</p>
          </div>

          {r.images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {r.images.map((url: string) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Customer photo" className="w-20 h-20 rounded-lg object-cover border" />
                </a>
              ))}
            </div>
          )}

          {r.adminNote && <p className="text-xs text-muted-foreground">Note: {r.adminNote}</p>}

          {r.status === "REQUESTED" && (
            <div className="space-y-2 pt-2 border-t">
              <input value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} placeholder="Message to customer (required to reject)" className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm" />
              <div className="flex gap-2">
                <Button size="sm" disabled={!!busy} onClick={() => act(`a-${r.id}`, () => decideReturnAction(r.id, "APPROVE", notes[r.id] ?? ""), "Approved")}>
                  {busy === `a-${r.id}` && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Approve
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" disabled={!!busy} onClick={() => act(`r-${r.id}`, () => decideReturnAction(r.id, "REJECT", notes[r.id] ?? ""), "Rejected")}>
                  Reject
                </Button>
              </div>
            </div>
          )}

          {r.status === "APPROVED" && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Refundable: ₹{r.refundable.toFixed(2)} {r.order.paymentMethod === "COD" ? "(COD — pay by UPI/bank, then mark paid on the order page)" : "(via Razorpay)"}
              </p>
              <div className="flex gap-2 flex-wrap">
                <input type="number" step="0.01" min="0.01" max={r.refundable} value={amounts[r.id] ?? r.refundable.toFixed(2)} onChange={(e) => setAmounts({ ...amounts, [r.id]: e.target.value })} className="w-32 h-9 px-3 rounded-lg border border-input bg-background text-sm" />
                <Button size="sm" disabled={!!busy || r.refundable <= 0} onClick={() => act(`f-${r.id}`, () => resolveReturnAction(r.id, "REFUND", Number(amounts[r.id] ?? r.refundable), notes[r.id] ?? ""), "Refund issued")}>
                  {busy === `f-${r.id}` && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Refund
                </Button>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act(`p-${r.id}`, () => resolveReturnAction(r.id, "REPLACEMENT", 0, notes[r.id] ?? ""), "Marked as replacement")}>
                  Send replacement
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">For a replacement, create it from Orders → New Order and ship it; this records the decision for the customer.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
