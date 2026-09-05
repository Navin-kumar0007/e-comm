"use client";
import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { addReview, getReviews } from "@/app/actions/reviews";
import { useSession } from "next-auth/react";

export function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviews(productId).then(data => {
      setReviews(data);
      setLoading(false);
    });
  }, [productId]);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please log in to submit a review");
      return;
    }
    if (!content) {
      toast.error("Please write a review");
      return;
    }

    setIsSubmitting(true);
    const result = await addReview(productId, rating, content);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Thank you! Your review has been submitted.");
    setContent("");
    setRating(5);
    
    // Refresh reviews
    getReviews(productId).then(setReviews);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-heading font-bold mb-8 text-center">Customer Reviews</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Write Review Form */}
        <div>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>
            {session ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                        <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Review Details</label>
                  <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24 resize-none"
                    placeholder="Tell us what you liked or disliked"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">Please log in to write a review.</p>
                <Button variant="outline" onClick={() => window.location.href = '/login'}>Log In</Button>
              </div>
            )}
          </div>
        </div>

        {/* Review List */}
        <div className="space-y-6">
          {loading ? (
            <p className="text-muted-foreground">Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="border-b border-border/50 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{review.user?.name || "Customer"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
