'use server';

import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '@/lib/auth-guard';

export async function approveRecipe(id: string) {
  await requireAdmin();
  await prisma.recipe.update({
    where: { id },
    data: { status: 'APPROVED' }
  });
  revalidatePath('/admin/recipes');
}

export async function deleteRecipe(id: string) {
  await requireAdmin();
  await prisma.recipe.delete({
    where: { id }
  });
  revalidatePath('/admin/recipes');
}

export async function getRecipes() {
  return prisma.recipe.findMany({
    orderBy: { createdAt: 'desc' },
    include: { products: true }
  });
}

export async function getRecipe(id: string) {
  return prisma.recipe.findUnique({
    where: { id },
    include: { products: true }
  });
}

export async function createRecipe(data: any) {
  await requireAdmin();
  const { productIds, ...recipeData } = data;
  
  const recipe = await prisma.recipe.create({
    data: {
      ...recipeData,
      products: {
        connect: productIds?.map((id: string) => ({ id })) || []
      }
    }
  });
  revalidatePath('/admin/recipes');
  revalidatePath('/recipes');
  return recipe;
}

export async function updateRecipe(id: string, data: any) {
  await requireAdmin();
  const { productIds, ...recipeData } = data;
  
  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...recipeData,
      products: {
        set: [], // clear existing
        connect: productIds?.map((id: string) => ({ id })) || []
      }
    }
  });
  revalidatePath('/admin/recipes');
  revalidatePath('/recipes');
  return recipe;
}

export async function submitRecipe(data: any) {
  await requireUser();
  const recipe = await prisma.recipe.create({
    data: {
      ...data,
      status: 'PENDING'
    }
  });
  revalidatePath('/admin/recipes');
  return recipe;
}
