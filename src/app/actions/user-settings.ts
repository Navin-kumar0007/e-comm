"use server";
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import * as fs from 'fs';
import * as path from 'path';

export async function updateUserSettings(data: any) {
  const logDir = "/Users/navin/.gemini/antigravity-ide/brain/f996eab0-bc69-4579-a12f-b6080923c61d/scratch";
  const logPath = path.join(logDir, "server_error.log");

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] Action invoked with: ${JSON.stringify(data)}\n`);

    const session = await auth();
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Session: ${JSON.stringify(session)}\n`);

    if (!session?.user?.email) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] User session email missing\n`);
      throw new Error("Not authenticated");
    }

    const { name, address, city, state, pincode, dietaryTagIds } = data;

    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Attempting user update for Email: ${session.user.email}\n`);

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

    fs.appendFileSync(logPath, `[${new Date().toISOString()}] User update succeeded!\n`);

    revalidatePath('/account/settings');
    revalidatePath('/shop');
    return { success: true };
  } catch (error: any) {
    const errorMsg = `[${new Date().toISOString()}] CRITICAL ERROR: ${error?.message || error}\nStack: ${error?.stack}\n`;
    fs.appendFileSync(logPath, errorMsg);
    throw error;
  }
}
