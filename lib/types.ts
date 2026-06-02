export type Category = {
  id: number;
  name: string;
  color: string;
};

export type QuizInput = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  categoryId: number;
};

export type QuizWithCategory = {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  categoryId: number;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
};

