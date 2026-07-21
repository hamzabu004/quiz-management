export type ExportFormat = 'csv' | 'pdf' | 'latex' | 'docx';

export const EXPORT_TEMPLATE_IDS = ['standard', 'answer-grid'] as const;

export type ExportTemplateId = (typeof EXPORT_TEMPLATE_IDS)[number];

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
