"use server";

import { prisma } from "@/lib/db/prisma";
import { recordConsent } from "@/lib/consent";
import { requirePermission } from "@/lib/auth-guard";
import {
  sendWhatsAppMessage,
  formatWhatsAppNumber,
  buildOfferWhatsAppMessage,
  buildNewReleaseWhatsAppMessage,
  buildPriceDropWhatsAppMessage,
} from "@/lib/whatsapp";

/**
 * Customer opt-in for WhatsApp alerts
 */
export async function subscribeWhatsAppAction(
  phone: string,
  name?: string,
  topics: { offers?: boolean; releases?: boolean; priceDrops?: boolean } = {}
) {
  if (!phone || phone.trim().length < 10) {
    return { error: "Please enter a valid 10-digit mobile number." };
  }

  const cleanPhone = formatWhatsAppNumber(phone);

  try {
    const subscriber = await prisma.whatsAppSubscriber.upsert({
      where: { phone: cleanPhone },
      update: {
        name: name?.trim() || undefined,
        subscribedOffers: topics.offers ?? true,
        subscribedNewReleases: topics.releases ?? true,
        subscribedPriceDrops: topics.priceDrops ?? true,
      },
      create: {
        phone: cleanPhone,
        name: name?.trim() || null,
        subscribedOffers: topics.offers ?? true,
        subscribedNewReleases: topics.releases ?? true,
        subscribedPriceDrops: topics.priceDrops ?? true,
      },
    });

    // The person typed their number and pressed the button next to the WhatsApp-offers notice.
    await recordConsent({ purpose: "WHATSAPP_OFFERS", granted: true, source: "POPUP", phone: cleanPhone });

    // Send a warm welcome message with an instant 10% coupon
    await sendWhatsAppMessage({
      to: cleanPhone,
      type: "WELCOME",
      template: { key: "welcome", params: [name?.trim() || "there", "ROYAL10", "https://www.spicynuts.in/shop"] },
      message: `🎉 *WELCOME TO THE SPICY NUTS VIP CIRCLE* 🎉

Namaste ${name ? name.trim() : "Valued Customer"}! You are now subscribed to receive imperial harvest updates, secret deals, and price alerts directly on WhatsApp.

🎁 *Here is your Welcome Gift:*
Use code *ROYAL10* at checkout for *10% OFF* on your next purchase!

🛍️ Explore our harvests: https://spicynuts.in/shop`,
    });

    return { success: true, subscriber };
  } catch (err: any) {
    console.error("Subscription error:", err);
    return { error: "Failed to subscribe. Please try again." };
  }
}

/**
 * Customer opt-in for product price drop on WhatsApp
 */
export async function subscribePriceAlertAction(productId: string, phone: string, email?: string) {
  if (!productId || !phone || phone.trim().length < 10) {
    return { error: "Please provide a valid phone number." };
  }

  const cleanPhone = formatWhatsAppNumber(phone);

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, price: true, salePrice: true, slug: true },
    });

    if (!product) return { error: "Product not found" };

    // Register PriceAlert
    await prisma.priceAlert.create({
      data: {
        productId,
        email: email || `${cleanPhone}@whatsapp.spicynuts.in`,
        phone: cleanPhone,
      },
    });

    // Also ensure recorded in WhatsAppSubscriber
    await prisma.whatsAppSubscriber.upsert({
      where: { phone: cleanPhone },
      update: { subscribedPriceDrops: true },
      create: { phone: cleanPhone, subscribedPriceDrops: true },
    });

    const currentPrice = product.salePrice || product.price;

    // Send confirmation
    await sendWhatsAppMessage({
      to: cleanPhone,
      type: "PRICE_UPDATE",
      template: { key: "price_alert_subscribed", params: [product.name, currentPrice, `https://www.spicynuts.in/product/${product.slug}`] },
      message: `🔔 *PRICE DROP ALERT ACTIVATED* 🔔

You will be the first to know when *${product.name}* (current price: ₹${currentPrice}) goes on sale or drops in price!

View harvest: https://spicynuts.in/product/${product.slug}`,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Price alert subscription error:", err);
    return { error: "Failed to register alert." };
  }
}

/**
 * Admin: Broadcast an offer/coupon to all WhatsApp subscribers
 */
export async function broadcastOfferAction({
  title,
  discount,
  couponCode,
  shopUrl,
}: {
  title: string;
  discount: number;
  couponCode: string;
  shopUrl?: string;
}) {
  await requirePermission('marketing.manage');

  const subscribers = await prisma.whatsAppSubscriber.findMany({
    where: { subscribedOffers: true },
    select: { phone: true, name: true },
  });

  if (subscribers.length === 0) {
    return { error: "No subscribers opted into offers yet." };
  }

  const message = buildOfferWhatsAppMessage({
    title,
    discount,
    couponCode,
    shopUrl,
  });

  let sentCount = 0;
  for (const sub of subscribers) {
    const res = await sendWhatsAppMessage({
      to: sub.phone,
      message,
      type: "OFFER",
      template: { key: "offer", params: [title, discount, couponCode.toUpperCase(), shopUrl || "https://www.spicynuts.in/shop"] },
    });
    if (res.success) sentCount++;
  }

  return { success: true, total: subscribers.length, sent: sentCount };
}

/**
 * Admin: Broadcast a newly released product to subscribers
 */
export async function broadcastNewReleaseAction(productId: string) {
  await requirePermission('marketing.manage');

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, price: true, salePrice: true, weight: true, slug: true },
  });

  if (!product) return { error: "Product not found" };

  const subscribers = await prisma.whatsAppSubscriber.findMany({
    where: { subscribedNewReleases: true },
    select: { phone: true },
  });

  if (subscribers.length === 0) {
    return { error: "No subscribers opted into new releases yet." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spicynuts.in";
  const message = buildNewReleaseWhatsAppMessage({
    productName: product.name,
    price: product.salePrice || product.price,
    weight: product.weight,
    productUrl: `${siteUrl}/product/${product.slug}`,
  });

  let sentCount = 0;
  for (const sub of subscribers) {
    const res = await sendWhatsAppMessage({
      to: sub.phone,
      message,
      type: "NEW_RELEASE",
      template: { key: "new_release", params: [product.name, product.weight || "-", product.salePrice || product.price, `${siteUrl}/product/${product.slug}`] },
    });
    if (res.success) sentCount++;
  }

  return { success: true, total: subscribers.length, sent: sentCount };
}

/**
 * Admin: Get WhatsApp Marketing Dashboard metrics
 */
export async function getWhatsAppMarketingDataAction() {
  await requirePermission('marketing.manage');

  const totalSubscribers = await prisma.whatsAppSubscriber.count();
  const offerSubscribers = await prisma.whatsAppSubscriber.count({ where: { subscribedOffers: true } });
  const releaseSubscribers = await prisma.whatsAppSubscriber.count({ where: { subscribedNewReleases: true } });
  const priceSubscribers = await prisma.whatsAppSubscriber.count({ where: { subscribedPriceDrops: true } });

  const recentLogs = await prisma.whatsAppLog.findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
  });

  const recentSubscribers = await prisma.whatsAppSubscriber.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return {
    metrics: {
      total: totalSubscribers,
      offers: offerSubscribers,
      releases: releaseSubscribers,
      priceDrops: priceSubscribers,
    },
    recentLogs,
    recentSubscribers,
  };
}

/** Which Meta templates are configured, with the exact text to submit for approval. */
export async function getWhatsAppTemplateStatusAction() {
  await requirePermission('marketing.manage');
  const { WA_TEMPLATES } = await import('@/lib/whatsapp-templates');
  return {
    provider: process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID ? 'META' : process.env.TWILIO_ACCOUNT_SID ? 'TWILIO' : 'SIMULATED',
    templates: Object.entries(WA_TEMPLATES).map(([key, t]) => ({
      key,
      env: t.env,
      category: t.category,
      body: t.body,
      example: t.example,
      configuredAs: process.env[t.env] || null,
    })),
  };
}
