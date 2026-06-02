"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import type { Category, QuizInput, QuizWithCategory } from "../lib/types";
import { updateQuiz } from "../lib/actions/quizzes";
import { CategoryFilter } from "./CategoryFilter";
import { ExportMenu } from "./ExportMenu";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { QuizCard } from "./QuizCard";

type QuizListProps = {
  initialQuizzes: QuizWithCategory[];
  categories: Category[];
};

export function QuizList({ initialQuizzes, categories }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<QuizWithCategory[]>(initialQuizzes);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const filteredQuizzes = useMemo(() => {
    if (!selectedCategoryIds.length) {
      return quizzes;
    }
    return quizzes.filter((quiz) => selectedCategoryIds.includes(quiz.categoryId));
  }, [quizzes, selectedCategoryIds]);

  const selectedQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => selectedIds.includes(quiz.id));
  }, [quizzes, selectedIds]);

  const handleEdit = (id: number) => {
    if (editingId && editingId !== id && isDirty) {
      const confirmSwitch = window.confirm(
        "You have unsaved edits. Discard changes and switch?"
      );
      if (!confirmSwitch) {
        return;
      }
    }
    setEditingId(id);
    setIsDirty(false);
  };

  const handleSave = async (id: number, data: QuizInput) => {
    const updated = await updateQuiz(id, data);
    setQuizzes((prev) =>
      prev.map((quiz) => (quiz.id === updated.id ? updated : quiz))
    );
    setEditingId(null);
    setIsDirty(false);
    toast.success("Quiz updated.");
  };

  const handleToggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedIds([]);
      }
      return next;
    });
  };

  if (!quizzes) {
    return <LoadingSkeleton />;
  }

  if (quizzes.length === 0) {
    return (
      <div className="rounded-none border border-border bg-surface/40 p-6 text-base">
        <p className="text-white">No quizzes yet.</p>
        <p className="text-muted">Create one from the Add page.</p>
        <Link
          href="/add"
          className="mt-3 inline-flex items-center rounded-none border border-border px-3 py-2 text-sm text-muted hover:text-white"
        >
          Add a quiz
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-base text-muted">Filter by category</p>
          <CategoryFilter
            categories={categories}
            selectedIds={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`rounded-none border px-3 py-2 text-lg ${
              selectionMode
                ? "border-white/50 bg-white/10 text-white"
                : "border-border text-muted hover:text-white"
            }`}
          >
            {selectionMode ? "Exit Selection" : "Select"}
          </button>
          <ExportMenu selectedQuizzes={selectedQuizzes} />
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="rounded-none border border-border bg-surface/40 p-6 text-base">
          <p className="text-white">No quizzes match this filter.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              isEditing={editingId === quiz.id}
              selectionMode={selectionMode}
              isSelected={selectedIds.includes(quiz.id)}
              onToggleSelect={handleToggleSelection}
              onEdit={handleEdit}
              onCancel={() => {
                setEditingId(null);
                setIsDirty(false);
              }}
              onSave={handleSave}
              onDirtyChange={setIsDirty}
            />
          ))}
        </div>
      )}
    </div>
  );
}
