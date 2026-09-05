'use server';
import { prisma } from '@/lib/db/prisma';

export async function submitContact(data: { name: string, email: string, message: string }) {
  try {
    if (!data.name || !data.email || !data.message) return { error: 'All fields are required' };

    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
      }
    });
    return { success: true };
  } catch (error: any) {
    return { error: 'Failed to send message' };
  }
}
