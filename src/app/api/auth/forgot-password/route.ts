import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendPasswordReset, siteUrl } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  try {
    const { allowed } = rateLimit(clientKey(req, "forgot-password"), 5, 15 * 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });

    if (user) {
      // At most 3 reset emails per account per hour.
      const recent = await prisma.passwordResetToken.count({
        where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      if (recent < 3) {
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        await prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
        });
        await sendPasswordReset(normalizedEmail, `${siteUrl()}/reset-password?token=${token}`);
      }
    }

    // Same answer whether or not the account exists (prevents email enumeration).
    return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
