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

    return { success: true, user: { id: user.id, name: user.name, email: user.email } };
  } catch (error: any) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong during registration' };
  }
}
