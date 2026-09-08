'use server';

import { prisma } from '@/lib/db/prisma';
import * as bcrypt from 'bcryptjs';

export async function registerUser({ name, email, password }: { name: string; email: string; password: string; }) {
  email = email.toLowerCase().trim();
  name = name.trim();
  try {
    if (!name || !email || !password) {
      return { error: 'Missing required fields' };
    }

    // Check if email was verified via OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { email, verified: true },
    });

    if (!otpRecord) {
      return { error: 'Email not verified. Please complete OTP verification first.' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { error: 'User already exists' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
      }
    });

    // Clean up OTP records for this email
    await prisma.otpVerification.deleteMany({ where: { email } });

    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong during registration' };
  }
}
