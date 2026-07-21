import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../src/lib/prisma';
import { EXPORT_TEMPLATE_IDS, type ExportTemplateId } from '../../../components/export/types';

type RequestedQuestion = {
  id: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

type DocumentQuestion = {
  questionStem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: '777777' };
const tableBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
  insideHorizontal: thinBorder,
  insideVertical: thinBorder,
};

function plainText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function textParagraph(text: string, options?: { bold?: boolean; center?: boolean; size?: number }) {
  return new Paragraph({
    alignment: options?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { after: 0 },
    children: [new TextRun({ text: plainText(text), bold: options?.bold, size: options?.size ?? 16 })],
  });
}

function buildStandardContent(subjectName: string, classroomName: string, questions: DocumentQuestion[]) {
  const content = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(subjectName)] }),
    new Paragraph({
      spacing: { after: 360 },
      children: [new TextRun({ text: classroomName, color: '666666', size: 20 })],
    }),
  ];

  questions.forEach((question, index) => {
    content.push(new Paragraph({
      keepNext: true,
      spacing: { before: 120, after: 100 },
      children: [
        new TextRun({ text: `${index + 1}. `, bold: true, size: 22 }),
        new TextRun({ text: plainText(question.questionStem), size: 22 }),
      ],
    }));
    [question.optionA, question.optionB, question.optionC, question.optionD].forEach((option, optionIndex) => {
      content.push(new Paragraph({
        indent: { left: 420 },
        spacing: { after: 80 },
        children: [
          new TextRun({ text: `${String.fromCharCode(65 + optionIndex)}. `, bold: true, size: 20 }),
          new TextRun({ text: plainText(option), size: 20 }),
        ],
      }));
    });
  });

  return content;
}

function gridCell(text: string, options?: { bold?: boolean; center?: boolean; fill?: string; width?: number }) {
  return new TableCell({
    width: options?.width ? { size: options.width, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: options?.fill ? { fill: options.fill } : undefined,
    children: [textParagraph(text, { bold: options?.bold, center: options?.center, size: 15 })],
  });
}

function buildGridContent(subjectName: string, classroomName: string, questions: DocumentQuestion[]) {
  const columnWidths = [2900, 1500, 1500, 1500, 1500, 1850];
  const headings = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Answer'];
  const header = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headings.map((heading, index) => gridCell(heading, {
      bold: true,
      center: index > 0,
      fill: 'E7E7E7',
      width: columnWidths[index],
    })),
  });

  const rows = questions.map((question, index) => new TableRow({
    cantSplit: true,
    children: [
      gridCell(`${index + 1}. ${question.questionStem}`, { width: columnWidths[0] }),
      gridCell(question.optionA, { width: columnWidths[1] }),
      gridCell(question.optionB, { width: columnWidths[2] }),
      gridCell(question.optionC, { width: columnWidths[3] }),
      gridCell(question.optionD, { width: columnWidths[4] }),
      gridCell('Ⓐ  Ⓑ  Ⓒ  Ⓓ', { center: true, width: columnWidths[5] }),
    ],
  }));

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: plainText(subjectName), bold: true, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: plainText(classroomName), color: '666666', size: 18 })],
    }),
    new Table({
      rows: [header, ...rows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths,
      layout: TableLayoutType.FIXED,
      borders: tableBorders,
      margins: { top: 90, bottom: 90, left: 90, right: 90 },
    }),
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { ids?: unknown; questions?: unknown; subjectId?: unknown; templateId?: unknown };
    const requestedQuestions = Array.isArray(body.questions)
      ? body.questions.filter((question): question is RequestedQuestion => (
          typeof question === 'object'
          && question !== null
          && typeof question.id === 'string'
          && typeof question.optionA === 'string'
          && typeof question.optionB === 'string'
          && typeof question.optionC === 'string'
          && typeof question.optionD === 'string'
        ))
      : [];
    const legacyIds = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
    const ids = requestedQuestions.length > 0 ? requestedQuestions.map((question) => question.id) : legacyIds;
    const subjectId = typeof body.subjectId === 'string' ? body.subjectId : '';
    const templateId: ExportTemplateId = EXPORT_TEMPLATE_IDS.includes(body.templateId as ExportTemplateId)
      ? body.templateId as ExportTemplateId
      : 'standard';

    if (ids.length === 0 || !subjectId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const [subject, unorderedMcqs] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId }, include: { classroom: true } }),
      prisma.mcq.findMany({ where: { subjectId, id: { in: ids } } }),
    ]);
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    const mcqById = new Map(unorderedMcqs.map((mcq) => [mcq.id, mcq]));
    const requestedQuestionById = new Map(requestedQuestions.map((question) => [question.id, question]));
    const questions = ids.flatMap((id): DocumentQuestion[] => {
      const mcq = mcqById.get(id);
      if (!mcq) return [];
      const requested = requestedQuestionById.get(id);
      return [{
        questionStem: mcq.questionStem,
        optionA: requested?.optionA ?? mcq.optionA,
        optionB: requested?.optionB ?? mcq.optionB,
        optionC: requested?.optionC ?? mcq.optionC,
        optionD: requested?.optionD ?? mcq.optionD,
      }];
    });
    if (questions.length === 0) return NextResponse.json({ error: 'No matching questions found' }, { status: 404 });

    const isGrid = templateId === 'answer-grid';
    const document = new Document({
      sections: [{
        properties: isGrid ? { page: { size: { orientation: PageOrientation.LANDSCAPE } } } : {},
        children: isGrid
          ? buildGridContent(subject.subjectName, subject.classroom.classroomName, questions)
          : buildStandardContent(subject.subjectName, subject.classroom.classroomName, questions),
      }],
    });
    const buffer = await Packer.toBuffer(document);
    const safeSubjectName = subject.subjectName.replace(/[^a-z0-9_-]+/gi, '_');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="export_${safeSubjectName}.docx"`,
      },
    });
  } catch (error) {
    console.error('DOCX Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
