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

export async function importCsvData(subjectId: string, csvContent: string) {
  // Very basic CSV parsing for demonstration purposes
  const lines = csvContent.split('\n');
  const importedMcqs: Array<{
    categoryName: string;
    data: {
      subjectId: string;
      questionStem: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      answer: string;
      explanation: string;
    };
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simplistic split (doesn't handle commas inside quotes)
    const values = line.split(',');
    if (values.length >= 7) {
      const stem = values[0];
      const categoryName = values[1];
      const optionA = values[2];
      const optionB = values[3];
      const optionC = values[4];
      const optionD = values[5];
      const answer = normalizeAnswer(values[6]);
      const explanation = values[7] || '';

      importedMcqs.push({
        categoryName,
        data: {
          subjectId,
          questionStem: stem,
          optionA,
          optionB,
          optionC,
          optionD,
          answer,
          explanation,
        },
      });
    }
  }

  const categoryNames = Array.from(new Set(importedMcqs.map((mcq) => mcq.categoryName)));
  const BULK_BATCH_SIZE = 500;

  await prisma.$transaction(async (tx) => {
    const existingCategories = await tx.category.findMany({
      where: { subjectId, categoryName: { in: categoryNames } },
      select: { id: true, categoryName: true },
    });
    const categoryByName = new Map(existingCategories.map((category) => [category.categoryName, category.id]));
    const missingCategoryNames = categoryNames.filter((name) => !categoryByName.has(name));

    if (missingCategoryNames.length > 0) {
      await tx.category.createMany({
        data: missingCategoryNames.map((categoryName) => ({ subjectId, categoryName })),
      });

      const createdCategories = await tx.category.findMany({
        where: { subjectId, categoryName: { in: missingCategoryNames } },
        select: { id: true, categoryName: true },
      });
      createdCategories.forEach((category) => categoryByName.set(category.categoryName, category.id));
    }

    const mcqsByCategory = new Map<string, typeof importedMcqs>();
    importedMcqs.forEach((mcq) => {
      const entries = mcqsByCategory.get(mcq.categoryName) ?? [];
      entries.push(mcq);
      mcqsByCategory.set(mcq.categoryName, entries);
    });

    for (const [categoryName, mcqs] of Array.from(mcqsByCategory.entries())) {
      const categoryId = categoryByName.get(categoryName);
      if (!categoryId) throw new Error(`Unable to create category "${categoryName}".`);

      // Each batch belongs to one category, so no returned-row ordering is required.
      for (let start = 0; start < mcqs.length; start += BULK_BATCH_SIZE) {
        const batch = mcqs.slice(start, start + BULK_BATCH_SIZE);
        const createdMcqs = await tx.mcq.createManyAndReturn({
          data: batch.map((mcq) => mcq.data),
          select: { id: true },
        });

        await tx.categoryMcq.createMany({
          data: createdMcqs.map((mcq) => ({ categoryId, mcqId: mcq.id })),
        });
      }
    }
  }, { maxWait: 5_000, timeout: 60_000 });

  revalidatePath(`/subject/${subjectId}`);
  return { success: true, count: importedMcqs.length };
}
