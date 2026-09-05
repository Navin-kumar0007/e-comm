import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { boxType, price } = body;

    if (!boxType || !price) {
      return NextResponse.json({ error: "Missing subscription details" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate next delivery date (1 month from now)
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);

    // Create the subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        boxType,
        price: Number(price),
        nextDeliveryDate,
        status: "ACTIVE",
      },
    });

    // Award loyalty points for subscribing! (e.g., 100 bonus points)
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: 100 } }
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error("Subscribe Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
