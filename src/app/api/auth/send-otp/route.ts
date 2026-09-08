import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

async function sendOTPEmail(email: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Spicy Nuts <spicynuts1973@gmail.com>";

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Your Spicy Nuts Verification Code",
          html: `
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #052c1e; background: #f4f3ea; padding: 32px; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #c59b27;">
                <h2 style="margin: 0; color: #052c1e; font-size: 24px;">✦ Spicy Nuts ✦</h2>
                <p style="margin: 4px 0 0; color: #8a6d1f; font-size: 12px; letter-spacing: 2px;">PURE · NATURAL · ORGANIC</p>
              </div>
              <h1 style="color: #052c1e; font-size: 20px; text-align: center;">Your Verification Code</h1>
              <div style="background: white; padding: 24px; border-radius: 12px; margin: 20px 0; border: 1px solid #e3dec9; text-align: center;">
                <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #052c1e;">${otp}</p>
              </div>
              <p style="text-align: center; color: #666; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
              <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">If you didn't request this code, please ignore this email.</p>
              <p style="color: #8a6d1f; font-size: 13px; margin-top: 24px; text-align: center;">— Team Spicy Nuts</p>
            </div>
          `,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        console.error(`[OTP EMAIL] Resend responded ${res.status}: ${detail}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[OTP EMAIL] Failed:", err);
      return false;
    }
  }

  // Dev fallback
  console.log("====================================");
  console.log(`[DEV OTP] Code for ${email}: ${otp}`);
  console.log("====================================");
  return true;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting: max 5 OTPs per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.otpVerification.count({
      where: { email: normalizedEmail, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 5) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in an hour." },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing OTPs for this email
    await prisma.otpVerification.deleteMany({ where: { email: normalizedEmail } });

    // Create new OTP record
    await prisma.otpVerification.create({
      data: { email: normalizedEmail, otpHash, expiresAt },
    });

    // Send the OTP
    const sent = await sendOTPEmail(normalizedEmail, otp);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
