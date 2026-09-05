"use server";

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function getUserPoints() {
  const session = await auth();
  if (!session?.user?.email) return 0;
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { points: true }
    });
    return user?.points || 0;
  } catch (e) {
    console.error("getUserPoints error:", e);
    return 0;
  }
}

export async function getUserProfile() {
  const session = await auth();
  if (!session?.user?.email) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
      }
    });
    return user;
  } catch (e) {
    console.error("getUserProfile error:", e);
    return null;
  }
}
