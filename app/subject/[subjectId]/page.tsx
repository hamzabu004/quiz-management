import prisma from '../../../src/lib/prisma';
import QuestionBankClient from '../../components/QuestionBankClient';
import { notFound } from 'next/navigation';
import { getMcqsPage } from '../../lib/mcq-pagination';

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

  const initialPage = await getMcqsPage({ subjectId });

  return (
    <QuestionBankClient
      subject={subject}
      initialMcqs={initialPage.mcqs}
      initialNextCursor={initialPage.nextCursor}
    />
  );
}
