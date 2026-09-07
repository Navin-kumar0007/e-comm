"use server";
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateUserSettings(data: any) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  const { name, address, city, state, pincode, dietaryTagIds } = data;

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      name,
      address,
      city,
      state,
      pincode,
      dietaryTags: {
        set: (dietaryTagIds || []).map((id: string) => ({ id }))
      }
    }
  });

  revalidatePath('/account/settings');
  revalidatePath('/shop');
  return { success: true };
}
