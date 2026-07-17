import prisma from '../../../src/lib/prisma';
import SubjectSelectionClient from '../../components/SubjectSelectionClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ClassroomPage({ params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId }
  });

  if (!classroom) {
    notFound();
  }

  const subjects = await prisma.subject.findMany({
    where: { classroomId: classroomId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <SubjectSelectionClient
      classroom={classroom}
      initialSubjects={subjects}
    />
  );
}
