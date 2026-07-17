// ============================================
// MCQ BANK SCHEMA - dbdiagram.io (DBML) syntax
// Target: PostgreSQL
// ============================================

Table app_user {
  id            uuid      [pk, default: `gen_random_uuid()`]
  email         varchar(255) [not null, unique]
  display_name  varchar(150) [not null]
  is_active     boolean   [not null, default: true]
  created_at    timestamptz [not null, default: `now()`]
  updated_at    timestamptz [not null, default: `now()`]

  note: 'Seed one hardcoded row now (fixed UUID) so all existing rows attribute to it. When multi-user launches, new signups just insert new rows here — no backfill needed.'
}

Table classroom {
  id            uuid      [pk, default: `gen_random_uuid()`]
  created_by    uuid      [not null, ref: > app_user.id, default: `'00000000-0000-0000-0000-000000000001'`, note: 'Owner. Hardcoded default user for now.']
  classroom_name varchar(150) [not null]
  subject_count int       [not null, default: 0, note: 'Denormalized, kept in sync via trigger']
  created_at    timestamptz [not null, default: `now()`]
  updated_at    timestamptz [not null, default: `now()`]
}

Table subject {
  id             uuid      [pk, default: `gen_random_uuid()`]
  classroom_id   uuid      [not null, ref: > classroom.id]
  created_by     uuid      [not null, ref: > app_user.id, default: `'00000000-0000-0000-0000-000000000001'`]
  subject_name   varchar(150) [not null]
  category_count int       [not null, default: 0, note: 'Denormalized, kept in sync via trigger']
  mcq_count      int       [not null, default: 0, note: 'Denormalized, kept in sync via trigger']
  created_at     timestamptz [not null, default: `now()`]
  updated_at     timestamptz [not null, default: `now()`]
}

Table category {
  id            uuid      [pk, default: `gen_random_uuid()`]
  subject_id    uuid      [not null, ref: > subject.id]
  created_by    uuid      [not null, ref: > app_user.id, default: `'00000000-0000-0000-0000-000000000001'`]
  category_name varchar(150) [not null]
  created_at    timestamptz [not null, default: `now()`]
}

Table mcq {
  id            uuid      [pk, default: `gen_random_uuid()`]
  subject_id    uuid      [not null, ref: > subject.id]
  created_by    uuid      [not null, ref: > app_user.id, default: `'00000000-0000-0000-0000-000000000001'`]
  question_stem text      [not null]
  option_a      varchar(500) [not null]
  option_b      varchar(500) [not null]
  option_c      varchar(500) [not null]
  option_d      varchar(500) [not null]
  answer        char(1)   [not null, note: 'CHECK constraint: answer IN (a,b,c,d)']
  explanation   text      [null]
  created_at    timestamptz [not null, default: `now()`]
  updated_at    timestamptz [not null, default: `now()`]
}

Table category_mcq {
  category_id   uuid      [not null, ref: > category.id]
  mcq_id        uuid      [not null, ref: > mcq.id]

  indexes {
    (category_id, mcq_id) [pk]
  }
}

// ============================================
// ASSUMPTIONS MADE (not specified in original text)
// ============================================
// 1. Using UUID as PK type (default gen_random_uuid()). Swap to BIGSERIAL/IDENTITY
//    if you prefer sequential int IDs — affects FK types everywhere.
// 2. Added created_at/updated_at to Classroom & Subject for consistency (originally
//    only MCQ and Category had timestamps).
// 3. category.created_at exists but no updated_at — assumed categories are rarely
//    edited after creation (rename only). Add updated_at if that's wrong.
// 4. mcq.subject_id is NOT NULL — assuming every MCQ must belong to a subject
//    even before being tagged into a category (loose/uncategorized MCQs allowed).
// 5. category_mcq has no surrogate `id`/no own timestamps — assumed it's a pure
//    junction table. Add created_at if you need to know "when was this MCQ tagged".
// 6. option_a-d assumed varchar(500) — adjust if you expect longer option text
//    (e.g. code snippets, images-as-text).
// 7. question_stem assumed `text` type (unbounded) since MCQ stems can be long
//    or contain formatted/rich content.
// 8. No `deleted_at` / soft-delete columns — assumed hard deletes with CASCADE
//    (as you explicitly requested cascade deletes). Add soft-delete if you need
//    audit trail / undo capability.
// 9. No user/author tracking (created_by) on any table — assumed out of scope
//    for this schema version, but likely needed for a multi-user setup.
// 10. Answer stored as single char referencing option key (a/b/c/d) — assumed
//     options are NOT independently reorderable per-question (i.e., a=option_a
//     always). If you allow shuffling options, consider a normalized `options`
//     table instead of a/b/c/d columns.

// ============================================
// POSTGRES-SPECIFIC EXTRAS (add during actual DDL — not representable in DBML)
// ============================================

// -- Seed hardcoded default user (run once, before any other inserts) --
// INSERT INTO app_user (id, email, display_name)
// VALUES ('00000000-0000-0000-0000-000000000001', 'system@internal', 'Default User')
// ON CONFLICT (id) DO NOTHING;
// When real auth lands: new users get normal generated UUIDs, existing rows
// stay pointed at this fixed id — no migration/backfill required.

// -- CHECK constraint on mcq.answer --
// ALTER TABLE mcq ADD CONSTRAINT chk_mcq_answer CHECK (answer IN ('a','b','c','d'));

// -- updated_at auto-touch trigger (generic, reusable per table) --
// CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS trigger AS $$
// BEGIN
//   NEW.updated_at = now();
//   RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;
// -- attach to classroom, subject, mcq via:
// CREATE TRIGGER set_updated_at BEFORE UPDATE ON mcq
//   FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

// -- subject_count sync on Subject insert/delete --
// CREATE OR REPLACE FUNCTION trg_sync_classroom_subject_count() RETURNS trigger AS $$
// BEGIN
//   IF (TG_OP = 'INSERT') THEN
//     UPDATE classroom SET subject_count = subject_count + 1 WHERE id = NEW.classroom_id;
//   ELSIF (TG_OP = 'DELETE') THEN
//     UPDATE classroom SET subject_count = subject_count - 1 WHERE id = OLD.classroom_id;
//   END IF;
//   RETURN NULL;
// END;
// $$ LANGUAGE plpgsql;
// CREATE TRIGGER subject_count_sync
//   AFTER INSERT OR DELETE ON subject
//   FOR EACH ROW EXECUTE FUNCTION trg_sync_classroom_subject_count();

// -- category_count + mcq_count sync on Subject --
// Similar AFTER INSERT/DELETE triggers on `category` (category_count) and
// on `category_mcq` or `mcq` (mcq_count) targeting subject.id.
// NOTE: decide whether mcq_count means "MCQs directly under subject_id"
// or "distinct MCQs tagged via category_mcq" — these can differ if an MCQ
// is untagged. Pick one source of truth to avoid drift.

// -- Cascade deletes --
// ALTER TABLE subject
//   ADD CONSTRAINT fk_subject_classroom
//   FOREIGN KEY (classroom_id) REFERENCES classroom(id) ON DELETE CASCADE;
//
// ALTER TABLE category
//   ADD CONSTRAINT fk_category_subject
//   FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE;
//
// ALTER TABLE mcq
//   ADD CONSTRAINT fk_mcq_subject
//   FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE;
//
// ALTER TABLE category_mcq
//   ADD CONSTRAINT fk_catmcq_category
//   FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE,
//   ADD CONSTRAINT fk_catmcq_mcq
//   FOREIGN KEY (mcq_id) REFERENCES mcq(id) ON DELETE CASCADE;

// -- Recommended indexes for query performance --
// CREATE INDEX idx_subject_classroom_id ON subject(classroom_id);
// CREATE INDEX idx_category_subject_id ON category(subject_id);
// CREATE INDEX idx_mcq_subject_id ON mcq(subject_id);
// CREATE INDEX idx_catmcq_mcq_id ON category_mcq(mcq_id); -- reverse lookup: categories for an MCQ