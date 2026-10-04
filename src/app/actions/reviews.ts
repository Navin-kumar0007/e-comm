"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

// Only images uploaded through our own review upload endpoint are accepted.
function isAllowedReviewImage(url: unknown): url is string {
  if (typeof url !== "string") return false;
  return (
    /^\/uploads\/reviews\/review-[\w-]+\.(jpg|png|webp)$/.test(url) ||
    url.startsWith("https://res.cloudinary.com/")
  );
}

export interface AddReviewInput {
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
  userName?: string;
  userEmail?: string;
}

export async function addReview(input: AddReviewInput) {
  const { productId, rating, comment, userName, userEmail } = input;

  if (!productId || !rating || !comment?.trim()) {
    return { error: "Please provide a rating and review details." };
  }
  if (comment.length > 2000) {
    return { error: "Review is too long (maximum 2000 characters)." };
  }

  const ip = ((await headers()).get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (!rateLimit(`review:${ip}`, 5, 10 * 60_000).allowed) {
    return { error: "You're posting reviews too quickly. Please try again later." };
  }

  const images = (Array.isArray(input.images) ? input.images : []).filter(isAllowedReviewImage).slice(0, 4);

  let session = null;
  try {
    session = await auth();
  } catch {}
  let userId: string | null = null;
  let reviewerName: string = userName?.trim().slice(0, 60) || "Customer";

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
    if (user) {
      userId = user.id;
      reviewerName = user.name || reviewerName;
    }
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });

    const newReview = await prisma.review.create({
      data: {
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        comment: comment.trim(),
        productId,
        userId,
        userName: reviewerName,
        userEmail: userEmail?.trim() || (session?.user?.email ?? null),
        images: JSON.stringify(images),
        status: "APPROVED",
      },
      include: {
        user: { select: { name: true } },
      },
    });

    try {
      if (product?.slug) {
        revalidatePath(`/product/${product.slug}`, "page");
      }
      revalidatePath("/shop");
    } catch (e) {
      console.warn("revalidatePath notice:", e);
    }

    return {
      success: true,
      review: {
        ...newReview,
        images: images,
        reviewerName: newReview.user?.name || newReview.userName || "Customer",
      },
    };
  } catch (error: any) {
    console.error("Review creation error:", error);
    return { error: "Failed to submit review. Please try again." };
  }
}

export async function getReviews(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews.map((r: any) => {
      let parsedImages: string[] = [];
      if (r.images) {
        try {
          parsedImages = JSON.parse(r.images);
        } catch {
          parsedImages = [r.images];
        }
      }
      return {
        ...r,
        images: parsedImages,
        reviewerName: r.user?.name || r.userName || "Customer",
      };
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}
