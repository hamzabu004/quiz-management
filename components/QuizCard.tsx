"use client";

import type { QuizInput, QuizWithCategory } from "../lib/types";
import { MarkdownPreview } from "./MarkdownPreview";
import { QuizEditForm } from "./QuizEditForm";

type QuizCardProps = {
  quiz: QuizWithCategory;
  isEditing: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onCancel: () => void;
  onSave: (id: number, data: QuizInput) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
};

export function QuizCard({
  quiz,
  isEditing,
  selectionMode,
  isSelected,
  onToggleSelect,
  onEdit,
  onCancel,
  onSave,
  onDirtyChange,
}: QuizCardProps) {
  if (isEditing) {
    return (
      <div className="rounded-none border border-border bg-surface/60 p-6 text-3xl">
        <QuizEditForm
          initial={{
            question: quiz.question,
            optionA: quiz.optionA,
            optionB: quiz.optionB,
            optionC: quiz.optionC,
            optionD: quiz.optionD,
            correctOption: quiz.correctOption as QuizInput["correctOption"],
            categoryId: quiz.categoryId,
          }}
          submitLabel="Update"
          onSave={(data) => onSave(quiz.id, data)}
          onCancel={onCancel}
          onDirtyChange={onDirtyChange}
        />
      </div>
    );
  }

  return (
    <div className="rounded-none border border-border bg-surface/40 p-6 text-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl uppercase text-muted tracking-wide">Question</p>
          <MarkdownPreview content={quiz.question} />
        </div>
        {selectionMode ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(quiz.id)}
            className="h-4 w-4 accent-white"
          />
        ) : null}
      </div>
      <ul className="mt-4 space-y-2">
        {([
          { label: "A", value: quiz.optionA },
          { label: "B", value: quiz.optionB },
          { label: "C", value: quiz.optionC },
          { label: "D", value: quiz.optionD },
        ] as const).map((option) => {
          const isCorrect = option.label === quiz.correctOption;
          return (
            <li
              key={option.label}
              className={`rounded-none border px-3 py-2 ${
                isCorrect
                  ? "border-emerald-400/60 bg-emerald-500/10"
                  : "border-border"
              }`}
            >
              <p className="text-sm uppercase text-muted tracking-wide">{option.label}</p>
              <MarkdownPreview content={option.value} />
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span
          className="rounded-none border border-border px-3 py-1 text-sm font-medium"
          style={{ color: quiz.category.color }}
        >
          {quiz.category.name}
        </span>
        <button
          type="button"
          onClick={() => onEdit(quiz.id)}
          className="rounded-none border border-border px-3 py-2 text-xl text-muted hover:text-white"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

