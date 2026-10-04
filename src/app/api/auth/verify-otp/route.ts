import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { allowed } = rateLimit(clientKey(req, "verify-otp"), 20, 10 * 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const { email, otp } = await req.json();

    if (!email || !otp || typeof email !== "string" || typeof otp !== "string") {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Only the newest code for this email is valid.
    const record = await prisma.otpVerification.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.verified) {
      return NextResponse.json({ error: "Invalid OTP. Please request a new code." }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many wrong attempts. Please request a new code." }, { status: 429 });
    }

    const expected = Buffer.from(record.otpHash);
    const given = Buffer.from(hashOTP(otp.trim()));
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
      await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      const left = MAX_ATTEMPTS - record.attempts - 1;
      return NextResponse.json(
        { error: left > 0 ? `Invalid OTP. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    return NextResponse.json({ success: true, verificationToken, message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
