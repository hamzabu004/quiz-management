-- Supports cursor pagination of a subject's newest MCQs.
CREATE INDEX "mcq_subject_id_created_at_id_idx"
ON "mcq" ("subject_id", "created_at" DESC, "id" DESC);
