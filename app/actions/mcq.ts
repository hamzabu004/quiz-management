"use server";

import prisma from '../../src/lib/prisma';
import { revalidatePath } from 'next/cache';

function normalizeAnswer(answer: string) {
  const normalized = answer.trim().toLowerCase();
  if (!['a', 'b', 'c', 'd'].includes(normalized)) {
    throw new Error('Correct answer must be A, B, C, or D.');
  }
  return normalized;
}

export async function deleteMcq(id: string, subjectId: string) {
  await prisma.mcq.delete({
    where: { id }
  });
  revalidatePath(`/subject/${subjectId}`);
}

export async function createMcq(data: {
  subjectId: string;
  questionStem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation?: string;
  categoryName: string;
}) {
  const { subjectId, categoryName, ...mcqData } = data;
  const answer = normalizeAnswer(mcqData.answer);
  
  // Find or create category
  let category = await prisma.category.findFirst({
    where: { subjectId, categoryName }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        subjectId,
        categoryName
      }
    });
  }

  const newMcq = await prisma.mcq.create({
    data: {
      ...mcqData,
      answer,
      subjectId,
      categories: {
        create: {
          categoryId: category.id
        }
      }
    }
  });

  revalidatePath(`/subject/${subjectId}`);
  return newMcq;
}

export async function updateMcq(id: string, data: {
  subjectId: string;
  questionStem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation?: string;
  categoryName: string;
}) {
  const { subjectId, categoryName, ...mcqData } = data;
  const answer = normalizeAnswer(mcqData.answer);
  
  // Find or create category
  let category = await prisma.category.findFirst({
    where: { subjectId, categoryName }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        subjectId,
        categoryName
      }
    });
  }

  // Update MCQ and its category association
  // First delete existing category associations
  await prisma.categoryMcq.deleteMany({
    where: { mcqId: id }
  });

  const updatedMcq = await prisma.mcq.update({
    where: { id },
    data: {
      ...mcqData,
      answer,
      categories: {
        create: {
          categoryId: category.id
        }
      }
    }
  });

  revalidatePath(`/subject/${subjectId}`);
  return updatedMcq;
}
