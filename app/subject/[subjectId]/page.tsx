import prisma from '../../../src/lib/prisma';
import QuestionBankClient from '../../components/QuestionBankClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      classroom: true,
      categories: true
    }
  });

  if (!subject) {
    notFound();
  }

  const mcqs = await prisma.mcq.findMany({
    where: { subjectId: subjectId },
    include: {
      categories: {
        include: {
          category: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Flatten the many-to-many relationship for simpler client consumption
  const formattedMcqs = mcqs.map(mcq => ({
    ...mcq,
    categoryName: mcq.categories[0]?.category.categoryName || 'Uncategorized'
  }));

  return (
    <QuestionBankClient
      subject={subject}
      initialMcqs={formattedMcqs}
    />
  );
}
