"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setReviewStatusAction, deleteReviewAction } from "@/app/actions/admin-reviews";

const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

export function ReviewsClient({ filter, reviews, counts }: { filter: string; reviews: any[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (fn: () => Promise<unknown>, msg: string) =>
    start(async () => {
      await fn();
      toast.success(msg);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground mt-1">Reviews from verified buyers publish instantly; all others wait here for approval.</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/reviews?status=${t}`} className={`px-3 py-1.5 rounded-lg text-sm ${filter === t ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
            {t !== "ALL" && <span className="ml-1 opacity-60">({counts[t] ?? 0})</span>}
          </Link>
        ))}
      </div>

      {reviews.length === 0 && <p className="p-6 rounded-2xl bg-card border text-muted-foreground">No reviews here.</p>}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className={`p-5 rounded-2xl bg-card border border-border/50 shadow-sm space-y-3 ${pending ? "opacity-70" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/product/${r.product?.slug}`} target="_blank" className="font-semibold hover:underline">{r.product?.name ?? "Product"}</Link>
                <p className="text-xs text-muted-foreground">
                  {r.user?.name || r.userName || "Guest"} · {r.user?.email || r.userEmail || "no email"} · {new Date(r.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.verifiedPurchase && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Verified Purchase</span>}
                <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}</span>
              </div>
            </div>
            {r.comment && <p className="text-sm whitespace-pre-wrap">{r.comment}</p>}
            {r.images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {r.images.map((url: string) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Review photo" className="w-16 h-16 rounded-lg object-cover border" />
                  </a>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {r.status !== "APPROVED" && (
                <Button size="sm" disabled={pending} onClick={() => act(() => setReviewStatusAction(r.id, "APPROVED"), "Published")}><Check className="w-4 h-4 mr-1" /> Publish</Button>
              )}
              {r.status !== "REJECTED" && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => act(() => setReviewStatusAction(r.id, "REJECTED"), "Hidden")}><X className="w-4 h-4 mr-1" /> Hide</Button>
              )}
              <Button size="sm" variant="ghost" className="text-red-600" disabled={pending} onClick={() => act(() => deleteReviewAction(r.id), "Deleted")}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
