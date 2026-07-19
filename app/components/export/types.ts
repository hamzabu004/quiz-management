export type ExportFormat = 'csv' | 'pdf' | 'latex' | 'docx';

export type ExportMcq = {
  id: string;
  questionStem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: string;
  explanation: string | null;
  categoryName: string;
};

export type ExportSubject = {
  id: string;
  subjectName: string;
  classroomName: string;
};
