"use client";

import toast from "react-hot-toast";
import type { QuizWithCategory } from "../lib/types";
import { buildDocxFallback } from "../lib/export/docx-fallback";
import { downloadBlob } from "../lib/utils/download";

type ExportMenuProps = {
  selectedQuizzes: QuizWithCategory[];
};

const formats = [
  { label: "PDF", value: "pdf" },
  { label: "DOCX", value: "docx" },
  { label: "LaTeX", value: "latex" },
] as const;

export function ExportMenu({ selectedQuizzes }: ExportMenuProps) {
  const disabled = selectedQuizzes.length === 0;

  const handleExport = async (format: (typeof formats)[number]["value"]) => {
    if (disabled) {
      return;
    }

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedQuizzes.map((quiz) => quiz.id),
          format,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename =
          response.headers
            .get("Content-Disposition")
            ?.match(/filename="?([^"]+)"?/i)?.[1] ?? `mcqs-export.${format}`;
        downloadBlob(blob, filename);
        toast.success("Export ready.");
        return;
      }

      if (response.status === 503 && format === "docx") {
        const payload = (await response.json()) as {
          markdown?: string;
          fallbackAvailable?: boolean;
        };
        if (payload.fallbackAvailable && payload.markdown) {
          const blob = await buildDocxFallback(payload.markdown);
          downloadBlob(blob, "mcqs-export.docx");
          toast.success("Built DOCX fallback.");
          return;
        }
      }

      toast.error("Export service unavailable.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed.";
      toast.error(message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {formats.map((format) => (
        <button
          key={format.value}
          type="button"
          disabled={disabled}
          onClick={() => handleExport(format.value)}
          className="rounded-none border border-border px-3 py-2 text-sm text-muted hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export {format.label}
        </button>
      ))}
    </div>
  );
}

