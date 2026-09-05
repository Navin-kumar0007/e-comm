/**
 * Sends the order-confirmation email.
 *
 * Uses Resend when RESEND_API_KEY is configured (no SDK dependency — plain REST call).
 * Falls back to a console log in development so local flows still work. In production
 * without a configured provider it logs a warning instead of silently pretending to send.
 */
export async function sendOrderConfirmation(email: string, orderId: string, total: number) {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #052c1e;">
      <h1 style="color: #052c1e;">Order Confirmation: #${orderId}</h1>
      <p>Thank you for your purchase from Nutty World!</p>
      <p>Your order total is <strong>₹${total.toFixed(2)}</strong>.</p>
      <p>You can track your order status in your account dashboard.</p>
    </div>
  `;
  const subject = `Order Confirmation #${orderId}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Nutty World <orders@nuttyworld.com>';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: email, subject, html: emailHtml }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error(`[EMAIL] Resend responded ${res.status}: ${detail}`);
        return { success: false };
      }
      return { success: true };
    } catch (err) {
      console.error('[EMAIL] Failed to send order confirmation:', err);
      return { success: false };
    }
  }

  // No provider configured.
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      `[EMAIL] RESEND_API_KEY not set — order confirmation for #${orderId} was NOT sent to ${email}.`
    );
    return { success: false };
  }

  console.log('====================================');
  console.log(`[DEV EMAIL] Would send to: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(emailHtml);
  console.log('====================================');
  return { success: true };
}
