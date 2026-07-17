import prisma from '../../../../../../src/lib/prisma';
import QuestionEditorClient from '../../../../../components/QuestionEditorClient';

export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';

export default async function EditQuestionPage({ params }: { params: Promise<{ subjectId: string, questionId: string }> }) {
  const { subjectId, questionId } = await params;
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

  const mcq = await prisma.mcq.findUnique({
    where: { id: questionId },
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  });

  if (!mcq) {
    notFound();
  }

  const formattedMcq = {
    ...mcq,
    categoryName: mcq.categories[0]?.category.categoryName || 'Uncategorized'
  };

  return (
    <QuestionEditorClient
      mode="edit"
      subject={subject}
      existingMcq={formattedMcq}
    />
  );
}
