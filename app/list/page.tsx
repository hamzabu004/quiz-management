import { getCategories } from "../../lib/actions/categories";
import { getQuizzes } from "../../lib/actions/quizzes";
import { QuizList } from "../../components/QuizList";

export default async function ListPage() {
  const [categories, quizzes] = await Promise.all([
    getCategories(),
    getQuizzes(),
  ]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Quiz List</h1>
        <p className="text-base text-muted">
          Filter, edit, and export your MCQ collection.
        </p>
      </header>
      <QuizList initialQuizzes={quizzes} categories={categories} />
    </section>
  );
}

