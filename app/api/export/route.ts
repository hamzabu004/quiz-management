import prisma from '../../../src/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ids = searchParams.get('ids');
  
  if (!ids) {
    return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
  }

  const idArray = ids.split(',');

  const unorderedMcqs = await prisma.mcq.findMany({
    where: {
      id: { in: idArray }
    },
    include: {
      categories: {
        include: { category: true }
      }
    }
  });
  const mcqById = new Map(unorderedMcqs.map((mcq) => [mcq.id, mcq]));
  const mcqs = idArray.flatMap((id) => {
    const mcq = mcqById.get(id);
    return mcq ? [mcq] : [];
  });

  const csvContent = 'ID,Category,Stem,Option_A,Option_B,Option_C,Option_D,Correct_Answer,Explanation\n' + 
    mcqs.map((q) => {
      const categoryName = q.categories[0]?.category.categoryName || 'Uncategorized';
      return `"${q.id}","${categoryName}","${q.questionStem.replace(/"/g, '""')}","${q.optionA.replace(/"/g, '""')}","${q.optionB.replace(/"/g, '""')}","${q.optionC.replace(/"/g, '""')}","${q.optionD.replace(/"/g, '""')}","${q.answer}","${(q.explanation || '').replace(/"/g, '""')}"`;
    }).join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="export.csv"'
    }
  });
}
