"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { QuizInput } from "../lib/types";
import { CategoryCombobox } from "./CategoryCombobox";
import { MarkdownPreview } from "./MarkdownPreview";

type QuizEditFormProps = {
  initial: QuizInput;
  onSave: (data: QuizInput) => Promise<void>;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  submitLabel?: string;
};

const optionLabels: Array<QuizInput["correctOption"]> = ["A", "B", "C", "D"];

export function QuizEditForm({
  initial,
  onSave,
  onCancel,
  onDirtyChange,
  submitLabel = "Save",
}: QuizEditFormProps) {
  const [question, setQuestion] = useState(initial.question);
  const [optionA, setOptionA] = useState(initial.optionA);
  const [optionB, setOptionB] = useState(initial.optionB);
  const [optionC, setOptionC] = useState(initial.optionC);
  const [optionD, setOptionD] = useState(initial.optionD);
  const [correctOption, setCorrectOption] = useState(initial.correctOption);
  const [categoryId, setCategoryId] = useState<number>(initial.categoryId);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(() => {
    return (
      question !== initial.question ||
      optionA !== initial.optionA ||
      optionB !== initial.optionB ||
      optionC !== initial.optionC ||
      optionD !== initial.optionD ||
      correctOption !== initial.correctOption ||
      categoryId !== initial.categoryId
    );
  }, [
    question,
    optionA,
    optionB,
    optionC,
    optionD,
    correctOption,
    categoryId,
    initial,
  ]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        categoryId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save quiz.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-base font-medium">Question</label>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              className="w-full rounded-none border border-border bg-surface px-3 py-2 text-base"
              placeholder="Type the question..."
            />
          </div>
          {([
            { label: "Option A", value: optionA, setter: setOptionA },
            { label: "Option B", value: optionB, setter: setOptionB },
            { label: "Option C", value: optionC, setter: setOptionC },
            { label: "Option D", value: optionD, setter: setOptionD },
          ] as const).map((option) => (
            <div key={option.label} className="space-y-2">
              <label className="text-base font-medium">{option.label}</label>
              <textarea
                value={option.value}
                onChange={(event) => option.setter(event.target.value)}
                rows={2}
                className="w-full rounded-none border border-border bg-surface px-3 py-2 text-base"
              />
            </div>
          ))}
          <div className="space-y-2">
            <label className="text-base font-medium">Correct Option</label>
            <select
              value={correctOption}
              onChange={(event) => setCorrectOption(event.target.value as QuizInput["correctOption"])}
              className="w-full rounded-none border border-border bg-surface px-3 py-2 text-base"
            >
              {optionLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <CategoryCombobox
            value={categoryId || null}
            onChange={setCategoryId}
            allowCreate
          />
        </div>
        <div className="space-y-4 rounded-none border border-border bg-surface/60 p-4">
          <div>
            <p className="text-sm uppercase text-muted tracking-wide">Preview</p>
            <MarkdownPreview content={question || "_No question yet_"} />
          </div>
          <div>
            <p className="text-sm uppercase text-muted tracking-wide">Options</p>
            <ul className="space-y-2">
              {[optionA, optionB, optionC, optionD].map((value, index) => (
                <li key={`${index}-${value}`} className="rounded-none border border-border px-3 py-2">
                  <MarkdownPreview content={value || "_Empty option_"} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-none bg-white px-4 py-2 text-base font-medium text-gray-900 transition hover:bg-gray-200 disabled:opacity-60"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-none border border-border px-4 py-2 text-base text-muted hover:text-white"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

