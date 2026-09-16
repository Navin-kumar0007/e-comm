"use server";

import { prisma } from "@/lib/db/prisma";
import * as bcrypt from "bcryptjs";
import { formatWhatsAppNumber, sendWhatsAppMessage } from "@/lib/whatsapp";

export async function registerUser({
  name,
  email,
  password,
  phone,
}: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  email = email.toLowerCase().trim();
  name = name.trim();
  try {
    if (!name || !email || !password) {
      return { error: "Missing required fields" };
    }

    // Check if email was verified via OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email, verified: true },
    });

    if (!otpRecord) {
      return { error: "Email not verified. Please complete OTP verification first." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanPhone = phone ? formatWhatsAppNumber(phone) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: cleanPhone,
        whatsappOptIn: true,
        role: "USER",
      },
    });

    // Clean up OTP records for this email
    await prisma.otpVerification.deleteMany({ where: { email } });

    // If phone provided, enroll in WhatsApp marketing & send instant welcome message
    if (cleanPhone && cleanPhone.length >= 10) {
      try {
        await prisma.whatsAppSubscriber.upsert({
          where: { phone: cleanPhone },
          update: {
            name,
            subscribedOffers: true,
            subscribedNewReleases: true,
            subscribedPriceDrops: true,
          },
          create: {
            phone: cleanPhone,
            name,
            subscribedOffers: true,
            subscribedNewReleases: true,
            subscribedPriceDrops: true,
          },
        });

        await sendWhatsAppMessage({
          to: cleanPhone,
          type: "WELCOME",
          message: `🎉 *WELCOME TO SPICY NUTS* 🎉

Namaste ${name}! Your account is now active. You will receive exclusive harvest offers, price drop alerts, and live order tracking directly on WhatsApp.

🎁 *Here is your Welcome Gift:*
Use coupon code *ROYAL10* at checkout for *10% OFF* on your first order!

🛍️ Explore our harvests: https://spicynuts.in/shop`,
        });
      } catch (waErr) {
        console.error("WhatsApp welcome dispatch failed:", waErr);
      }
    }

    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: "Something went wrong during registration" };
  }
}
