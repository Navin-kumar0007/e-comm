import { NextResponse } from "next/server";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { allowed } = rateLimit(clientKey(req, "reset-password"), 10, 15 * 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const { token, password } = await req.json();
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link has expired or was already used. Please request a new one." }, { status: 400 });
    }

    // Single use: claim the token before changing the password.
    const claimed = await prisma.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ error: "This reset link was already used." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { password: await bcrypt.hash(password, 10) },
    });
    // Invalidate any other outstanding links for this account.
    await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
