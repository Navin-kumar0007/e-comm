"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Star, User, Camera, X, Loader2, CheckCircle2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addReview, getReviews } from "@/app/actions/reviews";
import { useSession } from "next-auth/react";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  reviewerName: string;
  createdAt: string | Date;
}

export function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    getReviews(productId).then((data: any) => {
      setReviews(data);
      setLoading(false);
    });
  }, [productId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 4) {
      toast.error("You can upload a maximum of 4 photos per review.");
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload/review", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          newUrls.push(data.url);
        } else if (data.error) {
          toast.error(data.error);
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploadedImages((prev) => [...prev, ...newUrls]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Please write a few words about the product quality.");
      return;
    }

    if (!session && !guestName.trim()) {
      toast.error("Please provide your name.");
      return;
    }

    setIsSubmitting(true);
    const result = await addReview({
      productId,
      rating,
      comment: comment.trim(),
      images: uploadedImages,
      userName: guestName.trim() || session?.user?.name || undefined,
      userEmail: guestEmail.trim() || session?.user?.email || undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Thank you! Your verified review has been published.");
    setComment("");
    setGuestName("");
    setGuestEmail("");
    setUploadedImages([]);
    setRating(5);

    // Refresh reviews immediately
    getReviews(productId).then((data: any) => setReviews(data));
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Summary */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
          Verified Customer Experiences
        </h2>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(Number(avgRating)) ? "fill-current" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <span className="font-bold text-foreground">{avgRating}/5</span>
          <span>•</span>
          <span>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Write Review Card */}
        <div className="lg:col-span-5 bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-sm relative lg:sticky lg:top-28">
          <h3 className="text-lg font-heading font-bold mb-1 text-foreground">
            Share Your Experience
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Help other connoisseurs discover authentic single-estate harvests.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Picker */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Overall Quality Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform focus:outline-hidden"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                  {rating === 5
                    ? "Excellent (5/5)"
                    : rating === 4
                    ? "Very Good (4/5)"
                    : rating === 3
                    ? "Good (3/5)"
                    : rating === 2
                    ? "Fair (2/5)"
                    : "Poor (1/5)"}
                </span>
              </div>
            </div>

            {/* Guest / User Info */}
            {!session && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Your Name *
                  </label>
                  <Input
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="h-9 text-xs rounded-xl bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    WhatsApp / Email
                  </label>
                  <Input
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="+91 or email (optional)"
                    className="h-9 text-xs rounded-xl bg-background"
                  />
                </div>
              </div>
            )}

            {session && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  Posting as <strong>{session.user?.name || session.user?.email}</strong> (Verified)
                </span>
              </div>
            )}

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Review Details *
              </label>
              <Textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the crunch, aroma, packaging, and freshness? We would love to hear!"
                className="min-h-[90px] text-xs rounded-xl bg-background resize-none"
              />
            </div>

            {/* Photo Upload with Thumbnail Previews */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">
                Add Photos (Unboxing &amp; Quality)
              </label>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Upload Button */}
                <button
                  type="button"
                  disabled={isUploading || uploadedImages.length >= 4}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-2xl border-2 border-dashed border-border hover:border-amber-500/60 bg-muted/40 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-amber-600 transition-all disabled:opacity-50 shrink-0"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Add</span>
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Uploaded Thumbnails with remove button */}
                {uploadedImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-2xl overflow-hidden border border-amber-500/30 group shrink-0 shadow-xs"
                  >
                    <Image src={url} alt="Review attachment" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-destructive text-white flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                JPG, PNG, or WebP up to 5MB (Max 4 photos).
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full h-11 rounded-xl bg-[#0A261D] hover:bg-[#051912] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 text-white font-bold text-xs shadow-md transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Publishing Review...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </form>
        </div>

        {/* Reviews Feed */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-heading font-bold text-lg text-foreground mb-4">
            Customer Feedback ({reviews.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews...
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border/50 shadow-xs space-y-3"
                >
                  {/* Top Bar: Reviewer info & Star Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {rev.reviewerName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Verified
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? "fill-current" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {rev.comment}
                  </p>

                  {/* Review Photos Gallery */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-2">
                      {rev.images.map((photoUrl, photoIdx) => (
                        <button
                          key={photoIdx}
                          type="button"
                          onClick={() => setActiveLightboxImage(photoUrl)}
                          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-border/50 hover:border-amber-500/50 transition-all group shrink-0 shadow-xs"
                        >
                          <Image
                            src={photoUrl}
                            alt={`Review photo ${photoIdx + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-muted/20 border border-border/50 text-center space-y-2">
              <p className="font-semibold text-sm text-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground">
                Be the first to share your harvest thoughts and upload a photo!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] w-full bg-zinc-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
          >
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full aspect-square sm:aspect-4/3 max-h-[75vh]">
              <Image
                src={activeLightboxImage}
                alt="Full review photo"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
