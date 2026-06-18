-- Add a generated tsvector column for full-text search over document name + content.
-- Prisma's schema cannot model a tsvector/generated column, so this is managed via raw SQL.
ALTER TABLE "Document"
  ADD COLUMN "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("content", '')), 'B')
  ) STORED;

-- GIN index to make the @@ matches fast.
CREATE INDEX "Document_search_vector_idx" ON "Document" USING GIN ("search_vector");
