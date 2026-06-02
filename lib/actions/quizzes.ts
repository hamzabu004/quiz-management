"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import type { QuizInput, QuizWithCategory } from "../types";

const validOptions = new Set(["A", "B", "C", "D"]);

function validateQuizInput(data: QuizInput) {
  if (!data.question.trim()) {
    throw new Error("Question is required.");
  }

  if (
    !data.optionA.trim() ||
    !data.optionB.trim() ||
    !data.optionC.trim() ||
    !data.optionD.trim()
  ) {
    throw new Error("All four options are required.");
  }

  if (!validOptions.has(data.correctOption)) {
    throw new Error("Correct option must be A, B, C, or D.");
  }

  if (data.categoryId <= 0 || Number.isNaN(data.categoryId)) {
    throw new Error("Category is required.");
  }
}

export async function getQuizzes(
  categoryIds?: number[]
): Promise<QuizWithCategory[]> {
  return prisma.quiz.findMany({
    where: categoryIds?.length
      ? {
          categoryId: {
            in: categoryIds,
          },
        }
      : undefined,
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  }) as unknown as Promise<QuizWithCategory[]>;
}

export async function createQuiz(
  data: QuizInput
): Promise<QuizWithCategory> {
  validateQuizInput(data);

  const quiz = (await prisma.quiz.create({
    data: {
      question: data.question.trim(),
      optionA: data.optionA.trim(),
      optionB: data.optionB.trim(),
      optionC: data.optionC.trim(),
      optionD: data.optionD.trim(),
      correctOption: data.correctOption,
      categoryId: data.categoryId,
    },
    include: { category: true },
  })) as unknown as QuizWithCategory;

  revalidatePath("/list");

  return quiz;
}

export async function updateQuiz(
  id: number,
  data: QuizInput
): Promise<QuizWithCategory> {
  validateQuizInput(data);

  const quiz = (await prisma.quiz.update({
    where: { id },
    data: {
      question: data.question.trim(),
      optionA: data.optionA.trim(),
      optionB: data.optionB.trim(),
      optionC: data.optionC.trim(),
      optionD: data.optionD.trim(),
      correctOption: data.correctOption,
      categoryId: data.categoryId,
    },
    include: { category: true },
  })) as unknown as QuizWithCategory;

  revalidatePath("/list");

  return quiz;
}

export async function deleteQuiz(id: number): Promise<void> {
  await prisma.quiz.delete({
    where: { id },
  });

  revalidatePath("/list");
}
