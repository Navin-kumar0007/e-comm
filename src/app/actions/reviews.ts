"use server";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface AddReviewInput {
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
  userName?: string;
  userEmail?: string;
}

export async function addReview(input: AddReviewInput) {
  const { productId, rating, comment, images = [], userName, userEmail } = input;

  if (!productId || !rating || !comment?.trim()) {
    return { error: "Please provide a rating and review details." };
  }

  let session = null;
  try {
    session = await auth();
  } catch {}
  let userId: string | null = null;
  let reviewerName: string = userName?.trim() || "Customer";

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
