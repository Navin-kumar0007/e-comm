import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (but always return success for security)
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      // In production, send a real password reset email via Resend
      // For now, log it
      console.log(`[PASSWORD RESET] Requested for: ${normalizedEmail}`);
      // TODO: Generate a secure token, store it, and email a reset link
    }

    // Always return success (prevents email enumeration)
    return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
