import { requirePagePermission } from "@/lib/auth-guard";
import { getAdminReviews } from "@/app/actions/admin-reviews";
import { ReviewsClient } from "./reviews-client";

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePagePermission("reviews.moderate");
  const { status } = await searchParams;
  const filter = (["PENDING", "APPROVED", "REJECTED", "ALL"].includes(status ?? "") ? status : "PENDING") as "PENDING" | "APPROVED" | "REJECTED" | "ALL";
  const data = await getAdminReviews(filter);
  return <ReviewsClient filter={filter} reviews={JSON.parse(JSON.stringify(data.reviews))} counts={data.counts} />;
}
