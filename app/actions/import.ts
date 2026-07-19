"use server";

import prisma from '../../src/lib/prisma';
import { revalidatePath } from 'next/cache';
import { parseCsv } from '../lib/csv';
import type { CsvImportMcq, CsvRow } from '../lib/csv';

const REQUIRED_HEADERS = [
  'Stem',
  'Category',
  'Option_A',
  'Option_B',
  'Option_C',
  'Option_D',
  'Correct_Answer',
  'Explanation',
] as const;

function normalizeAnswer(answer: unknown, location: string) {
  if (typeof answer !== 'string') {
    throw new Error(`${location}: Correct_Answer must be A, B, C, or D.`);
  }

  const normalized = answer.trim().toLowerCase();
  if (!['a', 'b', 'c', 'd'].includes(normalized)) {
    throw new Error(`${location}: Correct_Answer must be A, B, C, or D.`);
  }
  return normalized;
}

function requireText(value: unknown, field: string, location: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${location}: ${field} cannot be empty.`);
  }
  return value.trim();
}

function parseCsvImport(csvContent: string): CsvImportMcq[] {
  const rows = parseCsv(csvContent);
  if (rows.length === 0) throw new Error('The CSV file is empty.');

  const headerIndexes = new Map(
    rows[0].values.map((header, index) => [header.trim().toLowerCase(), index]),
  );
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headerIndexes.has(header.toLowerCase()),
  );

  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required column(s): ${missingHeaders.join(', ')}.`);
  }

  const valueAt = (row: CsvRow, header: (typeof REQUIRED_HEADERS)[number]) => {
    const index = headerIndexes.get(header.toLowerCase());
    return index === undefined ? '' : (row.values[index] ?? '').trim();
  };

  const importedMcqs = rows.slice(1).map((row) => {
    const location = `CSV line ${row.lineNumber}`;
    return {
      questionStem: requireText(valueAt(row, 'Stem'), 'Stem', location),
      categoryName: requireText(valueAt(row, 'Category'), 'Category', location),
      optionA: requireText(valueAt(row, 'Option_A'), 'Option_A', location),
      optionB: requireText(valueAt(row, 'Option_B'), 'Option_B', location),
      optionC: requireText(valueAt(row, 'Option_C'), 'Option_C', location),
      optionD: requireText(valueAt(row, 'Option_D'), 'Option_D', location),
      answer: normalizeAnswer(valueAt(row, 'Correct_Answer'), location),
      explanation: valueAt(row, 'Explanation'),
    };
  });

  if (importedMcqs.length === 0) {
    throw new Error('The CSV file does not contain any questions.');
  }

  return importedMcqs;
}

function validateImportItems(items: CsvImportMcq[]): CsvImportMcq[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('There are no questions to import.');
  }

  return items.map((item, index) => {
    const location = `Question ${index + 1}`;
    return {
      questionStem: requireText(item?.questionStem, 'Stem', location),
      categoryName: requireText(item?.categoryName, 'Category', location),
      optionA: requireText(item?.optionA, 'Option_A', location),
      optionB: requireText(item?.optionB, 'Option_B', location),
      optionC: requireText(item?.optionC, 'Option_C', location),
      optionD: requireText(item?.optionD, 'Option_D', location),
      answer: normalizeAnswer(item?.answer, location),
      explanation: typeof item?.explanation === 'string' ? item.explanation.trim() : '',
    };
  });
}

export async function previewCsvData(csvContent: string) {
  return parseCsvImport(csvContent);
}

export async function importCsvData(subjectId: string, items: CsvImportMcq[]) {
  const importedMcqs = validateImportItems(items);

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

    const mcqsByCategory = new Map<string, CsvImportMcq[]>();
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
          data: batch.map((mcq) => ({
            subjectId,
            questionStem: mcq.questionStem,
            optionA: mcq.optionA,
            optionB: mcq.optionB,
            optionC: mcq.optionC,
            optionD: mcq.optionD,
            answer: mcq.answer,
            explanation: mcq.explanation,
          })),
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
