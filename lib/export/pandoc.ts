import type { QuizWithCategory } from "../types";

export type ExportFormat = "pdf" | "latex" | "docx";

export function buildMarkdownDocument(quizzes: QuizWithCategory[]): string {
  return quizzes
    .map((quiz, index) => {
      const options = [
        { label: "A", value: quiz.optionA },
        { label: "B", value: quiz.optionB },
        { label: "C", value: quiz.optionC },
        { label: "D", value: quiz.optionD },
      ];

      const optionLines = options
        .map((option) => {
          const isCorrect = option.label === quiz.correctOption;
          const label = isCorrect
            ? `**${option.label}. ${option.value}** *(Correct)*`
            : `${option.label}. ${option.value}`;
          return `- ${label}`;
        })
        .join("\n");

      return [
        `## Question ${index + 1}`,
        "",
        quiz.question,
        "",
        optionLines,
        "",
        `*${quiz.category.name}*`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

export async function convertWithPandoc(
  markdown: string,
  format: ExportFormat
): Promise<{
  data: ArrayBuffer;
  contentType: string;
  filename: string;
}> {
  const serviceUrl = process.env.PANDOC_SERVICE_URL;
  if (!serviceUrl) {
    throw new Error("Pandoc service unavailable");
  }

  const timeout = Number(process.env.PANDOC_SERVICE_TIMEOUT ?? 30000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PANDOC_SERVICE_API_KEY
          ? { "X-API-Key": process.env.PANDOC_SERVICE_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        markdown,
        format,
        options: {
          inputFormat: "markdown+tex_math_dollars",
          pdfEngine: "xelatex",
          standalone: true,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Pandoc service error: ${response.status}`);
    }

    const data = await response.arrayBuffer();
    const contentType =
      response.headers.get("Content-Type") ?? "application/octet-stream";
    const filename = `mcqs-export.${format}`;

    return { data, contentType, filename };
  } finally {
    clearTimeout(timeoutId);
  }
}

