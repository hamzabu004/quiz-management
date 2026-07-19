import { notFound } from 'next/navigation';
import prisma from '../../../../src/lib/prisma';
import ExportWorkspaceClient from '../../../components/export/ExportWorkspaceClient';
import type { ExportFormat } from '../../../components/export/types';

const EXPORT_FORMATS: ExportFormat[] = ['csv', 'pdf', 'latex', 'docx'];

export default async function ExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ ids?: string; format?: string }>;
}) {
  const [{ subjectId }, query] = await Promise.all([params, searchParams]);
  const ids = Array.from(new Set((query.ids ?? '').split(',').filter(Boolean)));
  if (ids.length === 0) notFound();

  const [subject, mcqs] = await Promise.all([
    prisma.subject.findUnique({
      where: { id: subjectId },
      include: { classroom: true },
    }),
    prisma.mcq.findMany({
      where: { subjectId, id: { in: ids } },
      include: { categories: { include: { category: true } } },
    }),
  ]);

  if (!subject || mcqs.length === 0) notFound();

  const mcqById = new Map(mcqs.map((mcq) => [mcq.id, mcq]));
  const orderedMcqs = ids.flatMap((id) => {
    const mcq = mcqById.get(id);
    if (!mcq) return [];
    return [{
      id: mcq.id,
      questionStem: mcq.questionStem,
      optionA: mcq.optionA,
      optionB: mcq.optionB,
      optionC: mcq.optionC,
      optionD: mcq.optionD,
      answer: mcq.answer,
      explanation: mcq.explanation,
      categoryName: mcq.categories[0]?.category.categoryName ?? 'Uncategorized',
    }];
  });
  const requestedFormat = query.format as ExportFormat;
  const initialFormat = EXPORT_FORMATS.includes(requestedFormat) ? requestedFormat : 'pdf';

  return (
    <ExportWorkspaceClient
      subject={{
        id: subject.id,
        subjectName: subject.subjectName,
        classroomName: subject.classroom.classroomName,
      }}
      initialMcqs={orderedMcqs}
      initialFormat={initialFormat}
    />
  );
}
