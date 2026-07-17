import { Classroom, Subject, MCQQuestion, Category } from './types';

export const initialClassrooms: Classroom[] = [
  {
    id: 'class-1',
    name: 'O Level Physics',
    level: 'O Level',
    cohort: 'Intensive Revision Batch',
    status: 'Active',
    avgScore: 78,
  },
  {
    id: 'class-2',
    name: 'A Level Chemistry',
    level: 'A Level',
    cohort: 'Term 2 Organic Chem',
    status: 'Active',
    avgScore: 82,
  },
  {
    id: 'class-3',
    name: 'IB Mathematics HL',
    level: 'IB',
    cohort: 'Calculus Core Module',
    status: 'Paused',
    avgScore: null,
  },
];

export const initialSubjects: Subject[] = [
  {
    id: 'sub-1',
    name: 'Mathematics',
    topicsCount: 12,
    mcqsCount: 450,
    classroomLevel: 'O Level',
    iconType: 'math',
  },
  {
    id: 'sub-2',
    name: 'Physics',
    topicsCount: 8,
    mcqsCount: 320,
    classroomLevel: 'O Level',
    iconType: 'physics',
  },
  {
    id: 'sub-3',
    name: 'Chemistry',
    topicsCount: 10,
    mcqsCount: 285,
    classroomLevel: 'O Level',
    iconType: 'chemistry',
  },
  {
    id: 'sub-4',
    name: 'Biology',
    topicsCount: 15,
    mcqsCount: 512,
    classroomLevel: 'O Level',
    iconType: 'biology',
  },
];

export const initialCategories: Category[] = [
  { id: 'cat-all', name: 'All Categories', subjectId: '' },
  { id: 'cat-1', name: 'Algebra', subjectId: 'sub-1' },
  { id: 'cat-2', name: 'Geometry', subjectId: 'sub-1' },
  { id: 'cat-3', name: 'Complex Numbers', subjectId: 'sub-1' },
  { id: 'cat-4', name: 'Calculus', subjectId: 'sub-1' },
  { id: 'cat-5', name: 'Mechanics', subjectId: 'sub-2' },
  { id: 'cat-6', name: 'Thermodynamics', subjectId: 'sub-2' },
  { id: 'cat-7', name: 'Organic Chemistry', subjectId: 'sub-3' },
  { id: 'cat-8', name: 'Cell Biology', subjectId: 'sub-4' },
];

export const initialMCQs: MCQQuestion[] = [
  {
    id: '4092',
    subjectId: 'sub-1',
    classroomLevel: 'O Level',
    category: 'Complex Numbers',
    difficulty: 'Medium',
    stem: 'If z is a complex number such that |z - 1| = |z + 1|, then the locus of z is:',
    options: [
      { id: 'opt-a', label: 'A', text: 'The imaginary axis' },
      { id: 'opt-b', label: 'B', text: 'The real axis' },
      { id: 'opt-c', label: 'C', text: 'A circle with radius 1' },
      { id: 'opt-d', label: 'D', text: 'An ellipse' },
    ],
    correctAnswerIds: ['opt-a'],
    explanation: 'The equation |z - 1| = |z + 1| states that the distance of z from 1 is equal to the distance of z from -1. The set of points equidistant from two points is the perpendicular bisector of the segment connecting them. The perpendicular bisector of the segment between -1 and 1 on the complex plane is the imaginary axis (y-axis).',
    createdAt: '2026-07-08T10:00:00Z',
  },
  {
    id: '1',
    subjectId: 'sub-1',
    classroomLevel: 'O Level',
    category: 'Algebra',
    difficulty: 'Easy',
    stem: 'If \\( 3x - 5 = 16 \\), what is the value of \\( x \\)?',
    options: [
      { id: 'opt-1a', label: 'A', text: '4' },
      { id: 'opt-1b', label: 'B', text: '6' },
      { id: 'opt-1c', label: 'C', text: '7' },
      { id: 'opt-1d', label: 'D', text: '21' },
    ],
    correctAnswerIds: ['opt-1c'],
    explanation: 'Add 5 to both sides: 3x = 21. Divide both sides by 3: x = 7.',
    createdAt: '2026-07-08T09:00:00Z',
  },
  {
    id: '2',
    subjectId: 'sub-1',
    classroomLevel: 'O Level',
    category: 'Geometry',
    difficulty: 'Medium',
    stem: 'The area of a circle is \\( 49\\pi \\) sq cm. What is its circumference?',
    options: [
      { id: 'opt-2a', label: 'A', text: '\\( 14\\pi \\) cm' },
      { id: 'opt-2b', label: 'B', text: '\\( 7\\pi \\) cm' },
      { id: 'opt-2c', label: 'C', text: '\\( 28\\pi \\) cm' },
      { id: 'opt-2d', label: 'D', text: '\\( 49\\pi \\) cm' },
    ],
    correctAnswerIds: ['opt-2a'],
    explanation: 'Area of circle = πr² = 49π, which gives r² = 49 or r = 7 cm. Circumference = 2πr = 2 * π * 7 = 14π cm.',
    createdAt: '2026-07-08T09:30:00Z',
  },
];
