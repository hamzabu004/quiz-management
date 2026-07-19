import prisma from '../../../../src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    type RequestedQuestion = {
      id: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
    };
    const body = await request.json() as { ids?: unknown; questions?: unknown; subjectId?: unknown };
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
    const ids = requestedQuestions.length > 0
      ? requestedQuestions.map((question) => question.id)
      : legacyIds;
    const subjectId = typeof body.subjectId === 'string' ? body.subjectId : '';

    if (ids.length === 0 || !subjectId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { classroom: true }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const unorderedMcqs = await prisma.mcq.findMany({
      where: { id: { in: ids } }
    });
    const mcqById = new Map(unorderedMcqs.map((mcq) => [mcq.id, mcq]));
    const requestedQuestionById = new Map(requestedQuestions.map((question) => [question.id, question]));
    const mcqs = ids.flatMap((id: string) => {
      const mcq = mcqById.get(id);
      return mcq ? [mcq] : [];
    });

    // Health check
    try {
      const healthResponse = await fetch('https://docx-service-web.onrender.com/health');
      if (!healthResponse.ok) {
        return NextResponse.json({ error: 'Document service is currently unavailable (Health check failed)' }, { status: 503 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Document service is offline' }, { status: 503 });
    }

    // Format data as requested by the service
    const payload = {
      subject: subject.subjectName,
      course: subject.classroom.classroomName,
      questions: mcqs.map(q => {
        const requestedQuestion = requestedQuestionById.get(q.id);
        return {
          question: q.questionStem,
          option_a: requestedQuestion?.optionA ?? q.optionA,
          option_b: requestedQuestion?.optionB ?? q.optionB,
          option_c: requestedQuestion?.optionC ?? q.optionC,
          option_d: requestedQuestion?.optionD ?? q.optionD,
        };
      })
    };

    const generateResponse = await fetch(`${process.env.DOCX_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.DOCX_API_KEY || ''
      },
      body: JSON.stringify(payload)
    });

    if (!generateResponse.ok) {
      const err = await generateResponse.text();
      console.error('Docx generation failed:', err);
      return NextResponse.json({ error: 'Failed to generate document from service', "actual_err": err }, { status: 500 });
    }

    const docxBuffer = await generateResponse.arrayBuffer();

    return new NextResponse(docxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="export_${subject.subjectName.replace(/\s+/g, '_')}.docx"`
      }
    });

  } catch (error) {
    console.error('DOCX Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
