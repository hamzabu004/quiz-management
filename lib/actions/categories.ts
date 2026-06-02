"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { generateCategoryColor } from "../utils/color";
import type { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Category name is required.");
  }

  const existing = await prisma.category.findUnique({
    where: { name: trimmed },
  });

  if (existing) {
    throw new Error("Category already exists.");
  }

  const category = await prisma.category.create({
    data: {
      name: trimmed,
      color: generateCategoryColor(),
    },
  });

  revalidatePath("/list");
  revalidatePath("/add");

  return category;
}

