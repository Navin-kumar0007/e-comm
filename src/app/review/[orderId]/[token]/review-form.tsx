"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addOrderReview } from "@/app/actions/reviews";

export default function ReviewForm({ orderId, token, product, done }: { orderId: string; token: string; product: { id: string; name: string; image: string }; done: boolean }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(done);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError("");
      const res = await addOrderReview({ orderId, token, productId: product.id, rating, comment });
      if ("error" in res && res.error) setError(res.error);
      else setSent(true);
    });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <Image src={product.image} alt="" width={56} height={56} className="size-14 shrink-0 rounded-lg object-cover" />
        <p className="min-w-0 flex-1 font-semibold">{product.name}</p>
      </div>
      {sent ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4" /> Thank you for your review!
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="p-1">
                <Star className={`size-8 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like? (optional)" maxLength={2000} rows={3} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submit} disabled={!rating || pending} className="w-full sm:w-auto">
            {pending ? "Sending…" : "Submit review"}
          </Button>
        </div>
      )}
    </div>
  );
}
