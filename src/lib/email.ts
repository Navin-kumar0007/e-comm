/**
 * Email notification system for Spicy Nuts.
 *
 * Uses Resend when RESEND_API_KEY is configured (no SDK dependency — plain REST call).
 * Falls back to a console log in development so local flows still work. In production
 * without a configured provider it logs a warning instead of silently pretending to send.
 */

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Spicy Nuts <spicynuts1973@gmail.com>';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error(`[EMAIL] Resend responded ${res.status}: ${detail}`);
        return { success: false };
      }
      return { success: true };
    } catch (err) {
      console.error('[EMAIL] Failed to send email:', err);
      return { success: false };
    }
  }

  // No provider configured.
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      `[EMAIL] RESEND_API_KEY not set — email "${subject}" was NOT sent to ${to}.`
    );
    return { success: false };
  }

  console.log('====================================');
  console.log(`[DEV EMAIL] Would send to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(html);
  console.log('====================================');
  return { success: true };
}

const baseStyles = `
  font-family: 'Georgia', serif;
  max-width: 560px;
  margin: 0 auto;
  color: #052c1e;
  background: #f4f3ea;
  padding: 32px;
  border-radius: 12px;
`;

const headerHtml = `
  <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #c59b27;">
    <h2 style="margin: 0; color: #052c1e; font-size: 24px;">✦ Spicy Nuts ✦</h2>
    <p style="margin: 4px 0 0; color: #8a6d1f; font-size: 12px; letter-spacing: 2px;">PURE · NATURAL · ORGANIC</p>
  </div>
`;

export async function sendOrderConfirmation(email: string, orderId: string, total: number) {
  const orderNum = orderId.slice(-8).toUpperCase();
  return sendEmail(email, `Order Confirmed — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Order Confirmed 🎉</h1>
      <p>Thank you for your purchase from Spicy Nuts!</p>
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e3dec9;">
        <p style="margin: 4px 0;"><strong>Order ID:</strong> #${orderNum}</p>
        <p style="margin: 4px 0;"><strong>Total:</strong> ₹${total.toFixed(2)}</p>
      </div>
      <p>We're preparing your order with care. You'll receive updates as we ship it.</p>
      <p style="color: #8a6d1f; font-size: 13px; margin-top: 24px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function sendOrderShipped(email: string, orderId: string, trackingNumber?: string, trackingUrl?: string) {
  const orderNum = orderId.slice(-8).toUpperCase();
  const trackingHtml = trackingNumber ? `
    <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e3dec9;">
      <p style="margin: 4px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
      ${trackingUrl ? `<p style="margin: 4px 0;"><a href="${trackingUrl}" style="color: #c59b27;">Track Your Package →</a></p>` : ''}
    </div>
  ` : '';
  
  return sendEmail(email, `Order Shipped — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Your Order Has Shipped 📦</h1>
      <p>Great news! Your order <strong>#${orderNum}</strong> is on its way.</p>
      ${trackingHtml}
      <p>Your package will arrive within 3-7 business days.</p>
      <p style="color: #8a6d1f; font-size: 13px; margin-top: 24px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function sendOrderDelivered(email: string, orderId: string) {
  const orderNum = orderId.slice(-8).toUpperCase();
  return sendEmail(email, `Order Delivered — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Order Delivered ✅</h1>
      <p>Your order <strong>#${orderNum}</strong> has been delivered successfully!</p>
      <p>We hope you enjoy your Spicy Nuts products. If you love them, we'd appreciate a review!</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spicy-nuts.vercel.app'}/account/orders" 
           style="display: inline-block; background: #052c1e; color: #fcfbf7; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Leave a Review
        </a>
      </div>
      <p style="color: #8a6d1f; font-size: 13px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function sendOrderCancelled(email: string, orderId: string) {
  const orderNum = orderId.slice(-8).toUpperCase();
  return sendEmail(email, `Order Cancelled — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Order Cancelled</h1>
      <p>Your order <strong>#${orderNum}</strong> has been cancelled.</p>
      <p>If you paid online, a refund will be processed within 5-7 business days.</p>
      <p>If this was a mistake or you'd like to reorder, visit our store anytime.</p>
      <p style="color: #8a6d1f; font-size: 13px; margin-top: 24px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function notifyAdminNewOrder(orderId: string, total: number, customerName: string, paymentMethod: string) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'spicynuts1973@gmail.com';
  const orderNum = orderId.slice(-8).toUpperCase();
  const payLabel = paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online Payment';
  
  return sendEmail(adminEmail, `🛒 New Order #${orderNum} — ₹${total.toFixed(2)}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">New Order Received! 🛒</h1>
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e3dec9;">
        <p style="margin: 4px 0;"><strong>Order:</strong> #${orderNum}</p>
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${customerName}</p>
        <p style="margin: 4px 0;"><strong>Amount:</strong> ₹${total.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Payment:</strong> ${payLabel}</p>
      </div>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spicy-nuts.vercel.app'}/admin/orders" style="color: #c59b27; font-weight: bold;">View in Admin Panel →</a></p>
    </div>
  `);
}


export async function notifyAdminContact(name: string, email: string, message: string) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'spicynuts1973@gmail.com';
  
  return sendEmail(adminEmail, `📬 New Contact Message from ${name}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">New Message Received 📬</h1>
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e3dec9;">
        <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
        <hr style="border: 0; border-top: 1px solid #e3dec9; margin: 12px 0;" />
        <p style="margin: 4px 0; white-space: pre-wrap;">${message}</p>
      </div>
      <p>Reply directly to the customer at <a href="mailto:${email}" style="color: #c59b27;">${email}</a>.</p>
    </div>
  `);
}
