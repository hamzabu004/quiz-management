import prisma from '../../../../src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ids, subjectId } = await request.json();

    if (!ids || !ids.length || !subjectId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { classroom: true }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const mcqs = await prisma.mcq.findMany({
      where: { id: { in: ids } }
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
      questions: mcqs.map(q => ({
        question: q.questionStem,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD
      }))
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
