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
  let verifiedPurchase = false;
  let reviewerName: string = userName?.trim().slice(0, 60) || "Customer";

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
    if (user) {
      userId = user.id;
      reviewerName = user.name || reviewerName;
      // "Verified Purchase" only when this account actually received the product.
      const bought = await prisma.order.count({
        where: {
          OR: [{ userId: user.id }, { customerEmail: { equals: session.user.email, mode: "insensitive" } }],
          status: { in: ["DELIVERED", "RETURNED"] },
          items: { some: { productId } },
        },
      });
      verifiedPurchase = bought > 0;
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
        verifiedPurchase,
        // Verified buyers publish instantly; everyone else is checked by an admin first.
        status: verifiedPurchase ? "APPROVED" : "PENDING",
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
      published: verifiedPurchase,
      review: {
        id: newReview.id,
        rating: newReview.rating,
        comment: newReview.comment,
        images,
        verifiedPurchase,
        createdAt: newReview.createdAt,
        reviewerName: newReview.user?.name || newReview.userName || "Customer",
      },
    };
  } catch (error: any) {
    console.error("Review creation error:", error);
    return { error: "Failed to submit review. Please try again." };
  }
}

/**
 * Review from the private link in a review request. The link proves the person received this
 * order, so the review counts as a verified purchase. One review per product per order.
 */
export async function addOrderReview(input: { orderId: string; token: string; productId: string; rating: number; comment?: string }) {
  const { orderId, token, productId } = input;
  const { checkLinkToken } = await import("@/lib/signed-link");
  if (!orderId || !checkLinkToken("review", orderId, token)) return { error: "This review link is not valid." };
  const rating = Math.round(Number(input.rating));
  if (!(rating >= 1 && rating <= 5)) return { error: "Please choose 1 to 5 stars." };
  const comment = (input.comment || "").trim();
  if (comment.length > 2000) return { error: "Review is too long (maximum 2000 characters)." };

  const ip = ((await headers()).get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  if (!rateLimit(`review:${ip}`, 10, 10 * 60_000).allowed) return { error: "Too many reviews at once. Please try again in a few minutes." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, customerName: true, customerEmail: true, userId: true, items: { select: { productId: true } } },
  });
  if (!order || order.status !== "DELIVERED") return { error: "Reviews open once your order is delivered." };
  if (!order.items.some((i) => i.productId === productId)) return { error: "This product is not in your order." };
  const already = await prisma.review.findFirst({ where: { productId, userEmail: { equals: order.customerEmail, mode: "insensitive" } }, select: { id: true } });
  if (already) return { error: "You have already reviewed this product. Thank you!" };

  // "Priya S." — first name and last initial only.
  const [first, ...rest] = order.customerName.trim().split(/\s+/);
  const userName = [first, rest.length ? `${rest[rest.length - 1][0].toUpperCase()}.` : ""].filter(Boolean).join(" ") || "Customer";
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  await prisma.review.create({
    data: { rating, comment: comment || null, productId, userId: order.userId, userName, userEmail: order.customerEmail, images: "[]", verifiedPurchase: true, status: "APPROVED" },
  });
  try {
    if (product?.slug) revalidatePath(`/product/${product.slug}`, "page");
  } catch {}
  return { success: true };
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

    // Only public fields — never send reviewer emails to the browser.
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
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        images: parsedImages,
        verifiedPurchase: r.verifiedPurchase,
        reviewerName: r.user?.name || r.userName || "Customer",
      };
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return [];
  }
}
