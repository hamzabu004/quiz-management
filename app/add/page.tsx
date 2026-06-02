"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { QuizEditForm } from "../../components/QuizEditForm";
import type { QuizInput } from "../../lib/types";
import { createQuiz } from "../../lib/actions/quizzes";

const emptyQuiz: QuizInput = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  categoryId: 0,
};

export default function AddPage() {
  const [draft, setDraft] = useState<QuizInput>(emptyQuiz);
  const [formKey, setFormKey] = useState(0);

  const handleSave = async (data: QuizInput) => {
    await createQuiz(data);
    toast.success("Quiz added.");
    setDraft({
      ...emptyQuiz,
      correctOption: data.correctOption,
      categoryId: data.categoryId,
    });
    setFormKey((prev) => prev + 1);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Add a Quiz</h1>
        <p className="text-sm text-muted">
          Write the question in Markdown or LaTeX. Preview updates instantly.
        </p>
      </header>
      <QuizEditForm key={formKey} initial={draft} onSave={handleSave} submitLabel="Create" />
    </section>
  );
}

