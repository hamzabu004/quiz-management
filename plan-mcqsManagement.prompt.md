## Plan: MCQ Quiz App (Build-Ready Spec)

This spec turns the high-level plan into concrete, implementable steps, files, and APIs. It is designed for a dark-only Next.js App Router build with Prisma (Neon), Markdown + LaTeX previews, inline editing, filtering, and export.

### 1) Target File Structure
```
app/
  layout.tsx
  globals.css
  page.tsx                # redirect to /list
  add/
    page.tsx
  list/
    page.tsx
  api/
    export/
      route.ts            # Pandoc export API
components/
  MarkdownPreview.tsx
  AppShell.tsx            # header + nav links
  ToastProvider.tsx
  CategoryCombobox.tsx
  CategoryFilter.tsx
  QuizCard.tsx
  QuizEditForm.tsx
  QuizList.tsx
  ExportMenu.tsx
  LoadingSkeleton.tsx
lib/
  prisma.ts
  actions/
    categories.ts
    quizzes.ts
  export/
    pandoc.ts             # Pandoc client + markdown builder
    docx-fallback.ts      # client-side DOCX fallback
  utils/
    color.ts
    debounce.ts
    download.ts
prisma/
  schema.prisma
pandoc-service/
  package.json
  src/server.ts
  Dockerfile
public/
  (existing assets)
```

### 2) Dependencies to Add
Add to `package.json`:
- `prisma`, `@prisma/client`
- `react-markdown`, `remark-math`, `rehype-katex`, `katex`
- `@tailwindcss/typography`
- `use-debounce`
- `react-hot-toast`
- `docx`
- `html2canvas` (for DOCX fallback image capture)

### 3) Prisma Schema (Exact)
```prisma
model Category {
  id      Int     @id @default(autoincrement())
  name    String  @unique
  color   String
  quizzes Quiz[]
}

model Quiz {
  id            Int      @id @default(autoincrement())
  question      String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption String
  categoryId    Int
  category      Category @relation(fields: [categoryId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```
- Environment: create `.env` with `DATABASE_URL` (Neon connection string).
- Example: `DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"`.
- Migration: `npx prisma migrate dev`.

### 4) Server Actions (Signatures + Responsibilities)
Create in `lib/actions` with `'use server'`.

`categories.ts`
- `getCategories(): Promise<Array<{ id; name; color }>>`
  - Fetch all categories ordered by name.
- `createCategory(name: string): Promise<{ id; name; color }>`
  - Validate non-empty, unique.
  - Generate hex color.
  - `revalidatePath('/list')`.

`quizzes.ts`
- `getQuizzes(categoryIds?: number[]): Promise<QuizWithCategory[]>`
  - Include `category`, order by `createdAt desc`.
- `createQuiz(data: QuizInput): Promise<QuizWithCategory>`
  - Validate required fields, correct option.
  - `revalidatePath('/list')`.
- `updateQuiz(id: number, data: QuizInput): Promise<QuizWithCategory>`
  - Validate and update.
  - `revalidatePath('/list')`.
- `deleteQuiz(id: number): Promise<void>`
  - Optional; revalidate list.

`QuizInput` shape:
```
{ question; optionA; optionB; optionC; optionD; correctOption; categoryId }
```

### 5) Components (Responsibilities + Props)
- `MarkdownPreview({ content, className? })` render Markdown+LaTeX.
- `AppShell({ children })` layout header + nav, active link styling.
- `ToastProvider` wraps `react-hot-toast`.
- `CategoryCombobox({ value, onChange, allowCreate })`
  - Fetch categories; allow create and select.
- `CategoryFilter({ categories, selectedIds, onChange })`
  - Multi-select chips + “All”.
- `QuizCard({ quiz, isEditing, onEdit, onCancel, onSave })`
  - Render read view or edit form.
- `QuizEditForm({ initial, onSave, onCancel })`
  - Textareas + previews + correct option + category combobox.
- `QuizList({ quizzes })`
  - Handles selection mode and passes to cards.
- `ExportMenu({ selectedQuizzes })`
  - PDF / LaTeX / DOCX.
- `LoadingSkeleton` for loading state.

### 6) UI States
- Loading: skeleton cards.
- Empty overall: link to `/add`.
- Empty filtered: message only.
- Error: toast + keep last known data.
- Edit mode: only one card at a time; confirm switch if dirty.

### 7) Export (Pandoc Service + Fallback)
- API route: `app/api/export/route.ts` accepts `{ ids: number[], format: 'pdf'|'latex'|'docx' }`.
- Server builds a single Markdown document:
  - `## Question N` heading
  - question text
  - bullet list of options with correct option in **bold** and marked *(Correct)*
  - category name in *italics*
  - `---` separator
- Pandoc service call:
  - POST JSON `{ markdown, format, options }`
  - options: `{ inputFormat: 'markdown+tex_math_dollars', pdfEngine: 'xelatex', standalone: true }`
  - headers: include `X-API-Key` if `PANDOC_SERVICE_API_KEY` is set
  - timeout: `PANDOC_SERVICE_TIMEOUT` (default 30000) via AbortController
- Service failure or missing `PANDOC_SERVICE_URL`:
  - Return 503 with `{ markdown, fallbackAvailable }` where fallbackAvailable is true only for DOCX.
- Client behavior:
  - If DOCX and 503 with fallback: render math to images via KaTeX + html2canvas, build DOCX with `docx`.
  - If PDF/LaTeX and 503: show toast that service is unavailable.
- Content-Disposition on success triggers download with correct extension.

### 8) Pandoc Microservice Reference
- Express service with:
  - `GET /health` returns `{ ok: true/false }`
  - `POST /convert` accepts `{ markdown, format, options }`
- Implementation:
  - Write markdown to temp file
  - Run `pandoc` with args for format + options (`xelatex` for PDF, `--standalone` for LaTeX)
  - Stream binary response with correct Content-Type
- Dockerfile: Node 18 Alpine + pandoc + minimal LaTeX packages

### 9) Routing
- `/add`: add quiz screen.
- `/list`: list screen.
- `/`: redirect to `/list`.

### 10) Styling and Dark Mode
- Force `<html className="dark">` in `app/layout.tsx`.
- Use `bg-gray-950 text-gray-100` base.
- Add `prose prose-invert` for preview.
- Import `katex/dist/katex.min.css` globally.

### 11) Environment Variables
- `DATABASE_URL` (required)
- `PANDOC_SERVICE_URL` (optional; if missing, Pandoc is treated as unavailable)
- `PANDOC_SERVICE_API_KEY` (optional)
- `PANDOC_SERVICE_TIMEOUT` (optional, default 30000)

### 12) Testing Checklist
- Add quiz success clears fields, keeps category selection.
- Create category inline and ensure it appears in dropdown.
- List shows new quiz without full refresh.
- Filter by category and count updates.
- Edit quiz, cancel, then re-open; data resets correctly.
- Selection mode toggles and export buttons enable/disable.
- Export PDF/DOCX/LaTeX downloads with correct content.
- Unmatched `$` in input does not crash preview.
- Pandoc configured: PDF/LaTeX/DOCX download works.
- Pandoc missing: DOCX fallback kicks in with toast; PDF/LaTeX show error toast.

### 13) Setup Commands (for future execution)
- `npm install`
- `npx prisma migrate dev`
- `npm run dev`
