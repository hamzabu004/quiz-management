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
  const headers = lines[0].split(',');
  
  const mcqs = [];
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

      // Find or create category
      let category = await prisma.category.findFirst({
        where: { subjectId, categoryName }
      });

      if (!category) {
        category = await prisma.category.create({
          data: { subjectId, categoryName }
        });
      }

      const mcq = await prisma.mcq.create({
        data: {
          subjectId,
          questionStem: stem,
          optionA,
          optionB,
          optionC,
          optionD,
          answer,
          explanation,
          categories: {
            create: {
              categoryId: category.id
            }
          }
        }
      });
      mcqs.push(mcq);
    }
  }

  revalidatePath(`/subject/${subjectId}`);
  return { success: true, count: mcqs.length };
}
