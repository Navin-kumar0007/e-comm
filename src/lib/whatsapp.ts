import { prisma } from "@/lib/db/prisma";

export type WhatsAppMessageType =
  | "OFFER"
  | "NEW_RELEASE"
  | "PRICE_UPDATE"
  | "ORDER_UPDATE"
  | "WELCOME";

export interface SendWhatsAppParams {
  to: string; // phone number e.g. "+919876543210" or "9876543210"
  message: string;
  type: WhatsAppMessageType;
}

/**
 * Standardize Indian and International phone numbers to WhatsApp international format (e.g. "919876543210")
 */
export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  // If 10 digits (standard Indian mobile), prepend 91
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
}

/**
 * Core WhatsApp Dispatcher.
 * Automatically tries:
 * 1. Meta WhatsApp Cloud API (if WHATSAPP_ACCESS_TOKEN & WHATSAPP_PHONE_NUMBER_ID are set)
 * 2. Twilio WhatsApp API (if TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN are set)
 * 3. Safe Simulation & Logging Mode (logs to WhatsAppLog in DB with status "SIMULATED")
 */
export async function sendWhatsAppMessage({ to, message, type }: SendWhatsAppParams): Promise<{
  success: boolean;
  status: "SENT" | "SIMULATED" | "FAILED";
  error?: string;
}> {
  const formattedTo = formatWhatsAppNumber(to);
  if (!formattedTo || formattedTo.length < 10) {
    return { success: false, status: "FAILED", error: "Invalid phone number" };
  }

  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;

  let deliveryStatus: "SENT" | "SIMULATED" | "FAILED" = "SIMULATED";

  try {
    // 1. Meta WhatsApp Cloud API
    if (metaToken && metaPhoneId) {
      const res = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedTo,
          type: "text",
          text: { preview_url: true, body: message },
        }),
      });

      if (res.ok) {
        deliveryStatus = "SENT";
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn("[WhatsApp Cloud API Error]:", errJson);
        deliveryStatus = "FAILED";
      }
    }
    // 2. Twilio WhatsApp API
    else if (twilioSid && twilioAuth) {
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64");

      const bodyParams = new URLSearchParams();
      bodyParams.append("From", fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`);
      bodyParams.append("To", `whatsapp:+${formattedTo}`);
      bodyParams.append("Body", message);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      });

      if (res.ok) {
        deliveryStatus = "SENT";
      } else {
        console.warn("[Twilio WhatsApp Error]:", await res.text().catch(() => ""));
        deliveryStatus = "FAILED";
      }
    } else {
      // 3. Simulation & Development Mode
      console.log(`[WhatsApp Simulated -> ${formattedTo}] [${type}]:\n${message}\n`);
      deliveryStatus = "SIMULATED";
    }

    // Persist to WhatsAppLog for audit & admin monitoring
    await prisma.whatsAppLog.create({
      data: {
        phone: formattedTo,
        message,
        type,
        status: deliveryStatus,
      },
    });

    return { success: deliveryStatus !== "FAILED", status: deliveryStatus };
  } catch (err: any) {
    console.error("[WhatsApp Send Exception]:", err);
    try {
      await prisma.whatsAppLog.create({
        data: {
          phone: formattedTo,
          message,
          type,
          status: "FAILED",
        },
      });
    } catch {}
    return { success: false, status: "FAILED", error: err.message };
  }
}

// -------------------------------------------------------------
// Message Template Builders
// -------------------------------------------------------------

export function buildOfferWhatsAppMessage({
  title,
  discount,
  couponCode,
  shopUrl = "https://spicynuts.in/shop",
}: {
  title: string;
  discount: number | string;
  couponCode: string;
  shopUrl?: string;
}): string {
  return `✨ *SPICY NUTS — ROYAL HARVEST OFFER* ✨

${title}

Enjoy an exclusive *${discount}% OFF* on our imperial single-estate dry fruits, Kashmiri walnuts & roasted spice blends!

🎁 *Use Coupon Code:* *${couponCode.toUpperCase()}*
🛍️ *Order Now:* ${shopUrl}

_100% Pure • Sun-Dried • Direct from Partner Farms_`;
}

export function buildNewReleaseWhatsAppMessage({
  productName,
  price,
  weight,
  productUrl,
}: {
  productName: string;
  price: number;
  weight?: string | null;
  productUrl: string;
}): string {
  return `🌰 *NEW HARVEST RELEASE AT SPICY NUTS* 🌰

We are delighted to introduce our freshest estate harvest:

👑 *${productName}*
📦 *Pack Size:* ${weight || "Premium Selection"}
💰 *Special Launch Price:* *₹${price}*

Experience pristine natural aroma and grade-A crunch.
👉 *Explore & Order:* ${productUrl}

_Free delivery across India on orders above ₹999_`;
}

export function buildPriceDropWhatsAppMessage({
  productName,
  oldPrice,
  newPrice,
  productUrl,
}: {
  productName: string;
  oldPrice: number;
  newPrice: number;
  productUrl: string;
}): string {
  const savings = Math.max(0, oldPrice - newPrice);
  return `📉 *PRICE DROP ALERT — SPICY NUTS* 📉

Exciting news! The price of *${productName}* has just dropped:

❌ Previous: ~₹${oldPrice}~
✅ *New Price: ₹${newPrice}* (Save ₹${savings})

Limited single-estate stock available at this updated price!
👉 *Claim Yours Now:* ${productUrl}`;
}

export function buildOrderConfirmationWhatsAppMessage({
  orderId,
  customerName,
  total,
  paymentMethod,
  items,
  trackingUrl,
}: {
  orderId: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number; weight?: string }>;
  trackingUrl: string;
}): string {
  const shortId = orderId.slice(-8).toUpperCase();
  const itemsText = items.map((i) => `• ${i.name} (${i.weight || "Standard"}) × ${i.quantity}`).join("\n");

  return `📦 *SPICY NUTS — ORDER CONFIRMED* 📦

Namaste ${customerName || "Customer"}, your royal harvest order is confirmed!

🔖 *Order ID:* #${shortId}
💳 *Payment:* ${paymentMethod}
💰 *Total Amount:* ₹${total}

🛒 *Ordered Items:*
${itemsText}

🚚 *Live Tracking:*
${trackingUrl}

We are hand-packing your parcel with zero-compromise freshness.
Need help? Reply to this message anytime!`;
}

export function createClickToWhatsAppUrl(phone: string, text: string): string {
  const formatted = formatWhatsAppNumber(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}
