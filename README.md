## MCQ Manager

Dark-mode MCQ quiz manager built with the Next.js App Router, Prisma (Postgres/Neon), and Markdown + LaTeX previews. Create, edit, filter, and export quizzes to PDF, DOCX, or LaTeX using a Pandoc microservice with a DOCX fallback.

### Features
- Add and edit MCQs with Markdown + LaTeX previews.
- Inline category creation with color tags.
- Filter and select quizzes for export.
- Export via Pandoc (PDF/LaTeX/DOCX) with a client-side DOCX fallback.

### Environment
Create a `.env` file with:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
PANDOC_SERVICE_URL="http://localhost:4000"
PANDOC_SERVICE_API_KEY=""
PANDOC_SERVICE_TIMEOUT="30000"
```

`PANDOC_SERVICE_URL` is optional; if missing, DOCX export falls back to a client-side builder.

### Setup
```
npm install
npx prisma migrate dev
npm run dev
```

### Pandoc Microservice (optional)
The Pandoc service lives in `pandoc-service/` and exposes `POST /convert` and `GET /health`.

```
cd pandoc-service
npm install
npm run dev
```
