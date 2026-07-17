import { Prisma } from '@prisma/client';
import prisma from '../../src/lib/prisma';

export const MCQS_PER_PAGE = 12;

export type PaginatedMcq = {
  id: string;
  questionStem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation: string | null;
  categoryName: string;
};

export type McqPage = {
  mcqs: PaginatedMcq[];
  nextCursor: string | null;
};

export async function getMcqsPage({
  subjectId,
  categoryNames = [],
  searchQuery = '',
  cursor,
}: {
  subjectId: string;
  categoryNames?: string[];
  searchQuery?: string;
  cursor?: string | null;
}): Promise<McqPage> {
  const normalizedSearch = searchQuery.trim();
  const where: Prisma.McqWhereInput = { subjectId };

  if (categoryNames.length > 0) {
    where.categories = {
      some: { category: { categoryName: { in: categoryNames } } },
    };
  }

  if (normalizedSearch) {
    where.OR = [
      { questionStem: { contains: normalizedSearch, mode: 'insensitive' } },
      { optionA: { contains: normalizedSearch, mode: 'insensitive' } },
      { optionB: { contains: normalizedSearch, mode: 'insensitive' } },
      { optionC: { contains: normalizedSearch, mode: 'insensitive' } },
      { optionD: { contains: normalizedSearch, mode: 'insensitive' } },
      {
        categories: {
          some: {
            category: { categoryName: { contains: normalizedSearch, mode: 'insensitive' } },
          },
        },
      },
    ];
  }

  const results = await prisma.mcq.findMany({
    where,
    include: { categories: { include: { category: true } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: MCQS_PER_PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = results.length > MCQS_PER_PAGE;
  const mcqs = results.slice(0, MCQS_PER_PAGE).map((mcq) => ({
    ...mcq,
    categoryName: mcq.categories[0]?.category.categoryName || 'Uncategorized',
  }));

  return {
    mcqs,
    nextCursor: hasMore ? mcqs.at(-1)?.id ?? null : null,
  };
}
