import prisma from '../../../../../src/lib/prisma';
import QuestionEditorClient from '../../../../components/QuestionEditorClient';

export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';

export default async function NewQuestionPage({ params }: { params: Promise<{ subjectId: string }> }) {
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

  return (
    <QuestionEditorClient
      mode="add"
      subject={subject}
    />
  );
}
