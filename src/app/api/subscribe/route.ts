import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

// Server-side plan catalogue — never trust a price sent by the browser.
const PLANS: Record<string, number> = {
  "Standard Box": 999,
  "Family Box": 1999,
};

const WELCOME_BONUS_POINTS = 100;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boxType } = await req.json();
    const price = typeof boxType === "string" ? PLANS[boxType] : undefined;
    if (!price) {
      return NextResponse.json({ error: "Unknown subscription plan" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const active = await prisma.subscription.findFirst({
      where: { userId: user.id, boxType, status: "ACTIVE" },
    });
    if (active) {
      return NextResponse.json({ error: `You already have an active ${boxType}.` }, { status: 409 });
    }

    // Bonus only on the user's first-ever subscription (prevents subscribe/cancel farming).
    const everSubscribed = (await prisma.subscription.count({ where: { userId: user.id } })) > 0;

    // Calculate next delivery date (1 month from now)
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        boxType,
        price,
        nextDeliveryDate,
        status: "ACTIVE",
      },
    });

    if (!everSubscribed) {
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: WELCOME_BONUS_POINTS } },
      });
    }

    return NextResponse.json({ success: true, subscription, bonusPoints: everSubscribed ? 0 : WELCOME_BONUS_POINTS });
  } catch (error: any) {
    console.error("Subscribe Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
