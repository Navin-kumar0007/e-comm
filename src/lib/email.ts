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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.spicynuts.in';

/** Escape customer-provided text before putting it into email HTML. */
function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

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
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spicynuts.in'}/account/orders" 
           style="display: inline-block; background: #052c1e; color: #fcfbf7; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Leave a Review
        </a>
      </div>
      <p style="color: #8a6d1f; font-size: 13px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function sendOrderCancelled(email: string, orderId: string, wasPrepaid = true) {
  const orderNum = orderId.slice(-8).toUpperCase();
  return sendEmail(email, `Order Cancelled — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Order Cancelled</h1>
      <p>Your order <strong>#${orderNum}</strong> has been cancelled.</p>
      ${wasPrepaid ? '<p>Your refund has been initiated and will reach your original payment method within 5-7 business days.</p>' : ''}
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
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${esc(customerName)}</p>
        <p style="margin: 4px 0;"><strong>Amount:</strong> ₹${total.toFixed(2)}</p>
        <p style="margin: 4px 0;"><strong>Payment:</strong> ${payLabel}</p>
      </div>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spicynuts.in'}/admin/orders" style="color: #c59b27; font-weight: bold;">View in Admin Panel →</a></p>
    </div>
  `);
}


export async function notifyAdminShippingIssue(orderId: string, customerName: string, problem: string) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'spicynuts1973@gmail.com';
  const orderNum = orderId.slice(-8).toUpperCase();
  return sendEmail(adminEmail, `⚠️ Book shipment manually — Order #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Automatic courier booking failed</h1>
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e3dec9;">
        <p style="margin: 4px 0;"><strong>Order:</strong> #${orderNum}</p>
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${esc(customerName)}</p>
        <p style="margin: 4px 0;"><strong>Reason:</strong> ${esc(problem)}</p>
      </div>
      <p>The order is safe. Open it and click <strong>Book shipment</strong> after fixing the reason (e.g. recharge the courier wallet).</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spicynuts.in'}/admin/orders/${orderId}" style="color: #c59b27; font-weight: bold;">Open order →</a></p>
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
        <p style="margin: 4px 0;"><strong>Name:</strong> ${esc(name)}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${esc(email)}</p>
        <hr style="border: 0; border-top: 1px solid #e3dec9; margin: 12px 0;" />
        <p style="margin: 4px 0; white-space: pre-wrap;">${esc(message)}</p>
      </div>
      <p>Reply directly to the customer at ${esc(email)}.</p>
    </div>
  `);
}

export async function sendRefundInitiated(email: string, orderId: string, amount: number, method: 'RAZORPAY' | 'MANUAL') {
  const orderNum = orderId.slice(-8).toUpperCase();
  return sendEmail(email, `Refund Initiated — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Refund Initiated</h1>
      <p>We have initiated a refund of <strong>₹${amount.toFixed(2)}</strong> for order <strong>#${orderNum}</strong>.</p>
      <p>${method === 'RAZORPAY'
        ? 'It will reach your original payment method within 5-7 business days.'
        : 'As this was a Cash on Delivery order, our team will contact you for your UPI / bank details and transfer it within 7-10 business days.'}</p>
      <p style="color: #8a6d1f; font-size: 13px; margin-top: 24px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function sendReturnUpdate(email: string, orderId: string, status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RESOLVED', note?: string | null) {
  const orderNum = orderId.slice(-8).toUpperCase();
  const lines: Record<typeof status, string> = {
    REQUESTED: 'We have received your return request and will review it within 24 hours.',
    APPROVED: 'Your return request has been approved. We will arrange a refund or replacement shortly.',
    REJECTED: 'Unfortunately we could not approve your return request.',
    RESOLVED: 'Your return request has been resolved.',
  };
  return sendEmail(email, `Return Request ${status === 'REQUESTED' ? 'Received' : status.charAt(0) + status.slice(1).toLowerCase()} — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Return Request Update</h1>
      <p>Order <strong>#${orderNum}</strong>: ${lines[status]}</p>
      ${note ? `<p style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e3dec9;">${esc(note)}</p>` : ''}
      <p style="color: #8a6d1f; font-size: 13px; margin-top: 24px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  return sendEmail(email, 'Reset your Spicy Nuts password', `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px; text-align: center;">Reset Your Password</h1>
      <p>We received a request to reset your password. This link is valid for <strong>1 hour</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #052c1e; color: #fcfbf7; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">If you didn't request this, you can ignore this email — your password won't change.</p>
      <p style="color: #8a6d1f; font-size: 13px; margin-top: 24px;">— Team Spicy Nuts</p>
    </div>
  `);
}

export async function notifyAdminReturnRequest(orderId: string, customerName: string, reason: string, details: string) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'spicynuts1973@gmail.com';
  const orderNum = orderId.slice(-8).toUpperCase();
  return sendEmail(adminEmail, `↩️ Return request — #${orderNum}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">New Return Request</h1>
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e3dec9;">
        <p style="margin: 4px 0;"><strong>Order:</strong> #${orderNum}</p>
        <p style="margin: 4px 0;"><strong>Customer:</strong> ${esc(customerName)}</p>
        <p style="margin: 4px 0;"><strong>Reason:</strong> ${esc(reason)}</p>
        <p style="margin: 4px 0; white-space: pre-wrap;">${esc(details)}</p>
      </div>
      <p><a href="${SITE_URL}/admin/returns" style="color: #c59b27; font-weight: bold;">Review in Admin →</a></p>
    </div>
  `);
}

export async function notifyAdminLowStock(items: Array<{ name: string; stock: number; threshold: number }>) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'spicynuts1973@gmail.com';
  const rows = items
    .map((i) => `<p style="margin: 4px 0;"><strong>${esc(i.name)}</strong> — ${i.stock <= 0 ? '<span style="color:#b91c1c">OUT OF STOCK</span>' : `${i.stock} left`} (alert at ${i.threshold})</p>`)
    .join('');
  return sendEmail(adminEmail, `⚠️ Low stock: ${items.map((i) => i.name).join(', ').slice(0, 80)}`, `
    <div style="${baseStyles}">
      ${headerHtml}
      <h1 style="color: #052c1e; font-size: 20px;">Low Stock Alert</h1>
      <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e3dec9;">${rows}</div>
      <p><a href="${SITE_URL}/admin/inventory" style="color: #c59b27; font-weight: bold;">Restock in Admin →</a></p>
    </div>
  `);
}

export function siteUrl() {
  return SITE_URL;
}

/** Morning report for the owner. `rows` are label/value pairs; `alerts` are things to act on today. */
export async function sendOwnerDailySummary(subject: string, title: string, rows: Array<[string, string]>, alerts: string[]) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || 'spicynuts1973@gmail.com';
  const table = rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#555">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:bold">${esc(v)}</td></tr>`).join('');
  const todo = alerts.length
    ? `<h2 style="font-size:16px;margin:20px 0 8px">Needs attention</h2><ul style="padding-left:18px;margin:0">${alerts.map((a) => `<li style="margin:4px 0">${esc(a)}</li>`).join('')}</ul>`
    : '<p style="margin-top:16px">Nothing needs attention today. 🎉</p>';
  return sendEmail(adminEmail, subject, `
    <div style="${baseStyles}">
      <h1 style="color:#6E1A2C;font-size:20px;margin:0 0 12px">${esc(title)}</h1>
      <table style="width:100%;border-collapse:collapse;background:white;padding:12px;border-radius:8px">${table}</table>
      ${todo}
      <p style="margin-top:20px"><a href="${SITE_URL}/admin" style="color:#6E1A2C;font-weight:bold">Open admin →</a></p>
    </div>
  `);
}

/** Shop counter bill: a link to the GST invoice. */
export async function sendBillEmail(to: string, customerName: string, invoiceNumber: string, total: number, link: string) {
  return sendEmail(to, `Your Spicy Nuts bill ${invoiceNumber} — ₹${total.toFixed(2)}`, `
    <div style="${baseStyles}">
      <h1 style="color:#6E1A2C;font-size:20px;margin:0 0 12px">Thank you for shopping at Spicy Nuts</h1>
      <p>Namaste ${esc(customerName || "")},</p>
      <p>Your bill <strong>${esc(invoiceNumber)}</strong> for <strong>₹${total.toFixed(2)}</strong> is ready.</p>
      <p style="margin:20px 0"><a href="${link}" style="background:#6E1A2C;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">View &amp; download your GST invoice</a></p>
      <p style="color:#666;font-size:12px">Keep this link private; anyone with it can see the bill.</p>
    </div>
  `);
}
