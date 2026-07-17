# Next.js Migration Guide

This document provides a holistic overview of the current React application to assist in migrating it to Next.js (App Router).

## 1. Application Overview
**Name**: Question Bank Manager (Lumina)
**Purpose**: An application for educators to manage, filter, import, export, and edit Multiple Choice Questions (MCQs) organized by Classrooms and Subjects.

## 2. Current Architecture & Tech Stack
- **Framework**: React 18+ (bootstrapped with Vite)
- **Styling**: Tailwind CSS
- **Icons**: `lucide-react`
- **Math/Typography Rendering**: `katex` (via a custom utility for formatting LaTeX)
- **State Management**: React `useState` / `useEffect` heavily synced with `localStorage` (Offline-first approach).

## 3. Data Models (see `src/types.ts`)
- **Classroom**: Represents a grade or class (e.g., "Grade 10"). Contains multiple subjects.
- **Subject**: Represents a specific course (e.g., "Mathematics").
- **Category**: Topics within a subject (e.g., "Algebra", "Geometry").
- **MCQQuestion**: The core data unit. Contains:
  - `id`, `subjectId`, `category`
  - `stem` (the question text, supports LaTeX)
  - `options` (Array of 4 items with `id`, `text`, `isCorrect`)
  - `explanation` (Optional explanation for the correct answer)

## 4. Core Components & Views

### App (`src/App.tsx`)
Acts as the central router and state manager. It holds the global state for MCQs and selected question IDs, persisting them to `localStorage`.
- **Views**: 
  - `dashboard` (Shows `ClassroomSelection.tsx`)
  - `subject` (Shows `SubjectSelection.tsx` or `QuestionBank.tsx` if a subject is selected)
  - `edit_question` (Shows `QuestionEditor.tsx`)

### Navigation
- **Header (`src/components/Header.tsx`)**: Global top bar.
- **Sidebar (`src/components/Sidebar.tsx`)**: Left navigation displaying classrooms and subjects dynamically.

### Features
- **QuestionBank (`src/components/QuestionBank.tsx`)**:
  - Displays lists of MCQs.
  - **Filtering & Search**: Filter by category, text search, and a "Selected Only" view.
  - **Selection Mode**: Users can toggle selection mode to select specific questions. Selected IDs persist across filter changes.
  - **Import**: CSV import dialog with structural guidelines (Stem, Category, Option_A, Option_B, Option_C, Option_D, Correct_Answer, Explanation).
  - **Export**: UI button (disabled when no selection is made) for exporting selected MCQs.
- **QuestionEditor (`src/components/QuestionEditor.tsx`)**:
  - Form to create or edit an MCQ.
  - Real-time LaTeX preview for the stem and options using `katex`.

## 5. Next.js Migration Recommendations

When rewriting this in Next.js using the App Router (`app/` directory), consider the following architectural shifts:

### A. Routing
Replace the manual `currentView` state in `App.tsx` with file-based routing:
- `/` -> Dashboard (`ClassroomSelection`)
- `/classroom/[classroomId]` -> Subject Selection (`SubjectSelection`)
- `/subject/[subjectId]` -> Question Bank (`QuestionBank`)
- `/subject/[subjectId]/question/new` -> Question Editor (New)
- `/subject/[subjectId]/question/[questionId]/edit` -> Question Editor (Edit)

### B. State Management & Data Persistence
- **Current**: LocalStorage (`lumina_mcqs`, `lumina_selected_mcq_ids`).
- **Next.js**: 
  - Move data persistence to a database (e.g., PostgreSQL with Prisma/Drizzle ORM).
  - Fetch data using Server Components to improve performance and SEO (if applicable).
  - Keep `selectedMCQIds` in client-side state (Zustand, React Context, or URL query parameters/localStorage depending on persistence needs).

### C. Server Actions & API Routes
- **Import CSV**: Move the CSV parsing logic to a Next.js Server Action or API Route (`/api/import`).
- **Export**: Generate export files (PDF/CSV) dynamically on the backend using an API Route (`/api/export`).

### D. Component Strategy (Client vs Server)
- **Server Components**: Layouts, Sidebar (if data is static/cached), generic wrappers, and data fetching for the Question Bank list.
- **Client Components**: 
  - `QuestionBank` interactive elements (Search inputs, Category toggles, Selection Checkboxes).
  - `QuestionEditor` (Forms heavily rely on client-side state and real-time LaTeX previews).

## 6. Key Business Logic to Preserve
- **Selection Persistence**: Ensuring that checking an MCQ, then changing search filters, does not lose the checked state.
- **LaTeX Rendering**: The `formatLaTeX` utility using KaTeX must be safely rendered on the client (or carefully sanitized if rendered on the server) to prevent XSS while maintaining math formatting.
- **CSV Structure enforcement**: The exact CSV headers currently specified in the import dialog must be maintained to ensure backwards compatibility with user data.
