"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { cancelMyOrderAction, requestReturnAction } from "@/app/actions/customer-orders";
import { RETURN_REASONS } from "@/lib/order-status-rules";

export function OrderActions({
  orderId,
  canCancel,
  canReturn,
  returnHours,
}: {
  orderId: string;
  canCancel: boolean;
  canReturn: boolean;
  returnHours: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "cancel" | "return">(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [returnReason, setReturnReason] = useState<keyof typeof RETURN_REASONS>("DAMAGED");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  if (!canCancel && !canReturn) return null;

  const cancel = async () => {
    setBusy(true);
    const res = await cancelMyOrderAction(orderId, reason);
    setBusy(false);
    if ("error" in res) return toast.error(res.error);
    toast.success("Order cancelled. Any online payment will be refunded in 5-7 business days.");
    setMode(null);
    router.refresh();
  };

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files).slice(0, 4 - photos.length)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload/review", { method: "POST", body: fd });
        const data = await res.json();
        if (data.url) setPhotos((p) => [...p, data.url]);
        else toast.error(data.error || `Couldn't upload ${file.name}`);
      } catch {
        toast.error(`Couldn't upload ${file.name}`);
      }
    }
    setUploading(false);
  };

  const submitReturn = async () => {
    setBusy(true);
    const res = await requestReturnAction({ orderId, reason: returnReason, details, images: photos });
    setBusy(false);
    if ("error" in res) return toast.error(res.error);
    toast.success("Return request sent. We'll get back to you within 24 hours.");
    setMode(null);
    router.refresh();
  };

  return (
    <div className="mt-4">
      {mode === null && (
        <div className="flex flex-wrap gap-4">
          {canCancel && (
            <button onClick={() => setMode("cancel")} className="text-sm font-medium text-destructive hover:underline underline-offset-4">
              Cancel Order
            </button>
          )}
          {canReturn && (
            <button onClick={() => setMode("return")} className="text-sm font-medium text-primary hover:underline underline-offset-4">
              Report a Problem / Return
            </button>
          )}
        </div>
      )}

      {mode === "cancel" && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
          <p className="text-sm font-medium">Cancel this order?</p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            maxLength={200}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
          />
          <div className="flex gap-2">
            <button onClick={cancel} disabled={busy} className="h-9 px-4 rounded-lg bg-destructive text-white text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, cancel order"}
            </button>
            <button onClick={() => setMode(null)} disabled={busy} className="h-9 px-4 rounded-lg border text-sm">
              Keep order
            </button>
          </div>
        </div>
      )}

      {mode === "return" && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <p className="text-sm font-medium">Report a problem</p>
          <p className="text-xs text-muted-foreground">Issues must be reported within {returnHours} hours of delivery. Please add clear photos of the product and packaging.</p>
          <select
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value as keyof typeof RETURN_REASONS)}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
          >
            {Object.entries(RETURN_REASONS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What went wrong? Which item?"
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
          <div className="flex flex-wrap gap-2 items-center">
            {photos.map((url) => (
              <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Return photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((x) => x !== url))}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <label className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={submitReturn} disabled={busy || uploading} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit request"}
            </button>
            <button onClick={() => setMode(null)} disabled={busy} className="h-9 px-4 rounded-lg border text-sm">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
