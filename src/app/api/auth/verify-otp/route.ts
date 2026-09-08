import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = hashOTP(otp);

    const record = await prisma.otpVerification.findFirst({
      where: { email: normalizedEmail, otpHash, verified: false },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      await prisma.otpVerification.delete({ where: { id: record.id } });
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
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
