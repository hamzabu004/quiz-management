import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { QuizWithCategory } from "@/lib/types";
import {
  buildMarkdownDocument,
  convertWithPandoc,
  type ExportFormat,
} from "../../../lib/export/pandoc";

const validFormats = new Set(["pdf", "latex", "docx"]);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ids?: number[];
    format?: ExportFormat;
  };

  const ids = body.ids ?? [];
  const format = body.format;

  if (!ids.length || !format || !validFormats.has(format)) {
    return NextResponse.json(
      { error: "Invalid export request." },
      { status: 400 }
    );
  }

  const quizzes = await prisma.quiz.findMany({
    where: { id: { in: ids } },
    include: { category: true },
  });

  const quizMap = new Map<number, (typeof quizzes)[number]>();
  for (const quiz of quizzes) {
    quizMap.set(quiz.id, quiz);
  }
  const orderedQuizzes = ids
    .map((id) => quizMap.get(id))
    .filter(
      (quiz): quiz is (typeof quizzes)[number] => quiz !== undefined
    ) as unknown as QuizWithCategory[];

  const markdown = buildMarkdownDocument(orderedQuizzes);

  try {
    const { data, contentType, filename } = await convertWithPandoc(
      markdown,
      format
    );

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      {
        markdown,
        fallbackAvailable: format === "docx",
      },
      { status: 503 }
    );
  }
}
