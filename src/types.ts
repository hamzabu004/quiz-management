export interface Classroom {
  id: string;
  name: string;
  level: 'O Level' | 'A Level' | 'IB' | 'AP' | 'General';
  cohort: string;
  status: 'Active' | 'Paused' | 'Archived';
  avgScore: number | null; // null if no score yet
}

export interface Subject {
  id: string;
  name: string;
  topicsCount: number;
  mcqsCount: number;
  classroomLevel: string; // e.g. "O Level"
  iconType: 'math' | 'physics' | 'chemistry' | 'biology' | 'general';
}

export interface MCQOption {
  id: string;
  label: string; // 'A', 'B', 'C', 'D'
  text: string;
}

export interface MCQQuestion {
  id: string;
  subjectId: string;
  classroomLevel: string; // "O Level", "A Level" etc
  category: string; // e.g. "Algebra", "Complex Numbers"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  stem: string;
  options: MCQOption[];
  correctAnswerIds: string[]; // typically one or multiple
  explanation: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  subjectId: string;
}
