-- ==============================================================================
-- CULTURAL TEAM — HARDENED POSTGRESQL RLS & SECURITY POLICIES
-- ==============================================================================
-- Execute this script in your Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ==============================================================================

-- 1. Ensure columns exist with correct types
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other Ideas';
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS suggestion TEXT;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_upvotes ON public.suggestions(upvotes DESC);

-- 3. Database-Level Length & Content Constraints (Enforces <= 1,000 chars)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_suggestions_title_length') THEN
    ALTER TABLE public.suggestions ADD CONSTRAINT chk_suggestions_title_length 
      CHECK (title IS NULL OR (char_length(trim(title)) >= 2 AND char_length(title) <= 120));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_suggestions_desc_length') THEN
    ALTER TABLE public.suggestions ADD CONSTRAINT chk_suggestions_desc_length 
      CHECK (description IS NULL OR char_length(description) <= 1000);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_suggestions_raw_length') THEN
    ALTER TABLE public.suggestions ADD CONSTRAINT chk_suggestions_raw_length 
      CHECK (suggestion IS NULL OR (char_length(trim(suggestion)) >= 2 AND char_length(suggestion) <= 1000));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_suggestions_upvotes_non_neg') THEN
    ALTER TABLE public.suggestions ADD CONSTRAINT chk_suggestions_upvotes_non_neg 
      CHECK (upvotes >= 0);
  END IF;
END $$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. SECURE RLS POLICIES (NO ANONYMOUS UPDATE OR DELETE)
-- ==============================================================================

-- A. SELECT: Anonymous visitors can read only approved public suggestions
DROP POLICY IF EXISTS "Public can view approved suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Public can view suggestions" ON public.suggestions;
CREATE POLICY "Public can view suggestions"
  ON public.suggestions
  FOR SELECT
  TO public
  USING (COALESCE(is_approved, true) = true);

-- B. INSERT: Anonymous visitors can insert valid, non-empty suggestions only
DROP POLICY IF EXISTS "Public can insert suggestions" ON public.suggestions;
CREATE POLICY "Public can insert suggestions"
  ON public.suggestions
  FOR INSERT
  TO public
  WITH CHECK (
    -- Require either valid title or valid suggestion text
    (
      title IS NOT NULL AND 
      char_length(trim(title)) >= 2 AND 
      char_length(title) <= 120 AND
      (description IS NULL OR char_length(description) <= 1000)
    )
    OR
    (
      suggestion IS NOT NULL AND 
      char_length(trim(suggestion)) >= 2 AND 
      char_length(suggestion) <= 1000
    )
  );

-- C. CRITICAL SECURITY: REVOKE ALL PUBLIC UPDATE AND DELETE POLICIES
-- Anonymous visitors MUST NOT be able to modify or delete suggestions directly
DROP POLICY IF EXISTS "Public can update upvotes" ON public.suggestions;
DROP POLICY IF EXISTS "Public can update suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Allow deletion of suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Public can delete suggestions" ON public.suggestions;

-- ==============================================================================
-- 6. CONTROLLED SECURE RPC FUNCTION FOR ATOMIC UPVOTING
-- ==============================================================================
-- Allows visitors to upvote only (+1 or -1) without granting direct UPDATE permissions
CREATE OR REPLACE FUNCTION public.toggle_upvote(p_id BIGINT, p_delta INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_votes INT;
BEGIN
  -- Strict input validation: delta can ONLY be +1 or -1
  IF p_delta NOT IN (1, -1) THEN
    RAISE EXCEPTION 'Invalid vote delta. Must be +1 or -1';
  END IF;

  UPDATE public.suggestions
  SET upvotes = GREATEST(0, COALESCE(upvotes, 0) + p_delta)
  WHERE id = p_id AND COALESCE(is_approved, true) = true
  RETURNING upvotes INTO v_new_votes;

  RETURN COALESCE(v_new_votes, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_upvote(BIGINT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_upvote(BIGINT, INT) TO anon, authenticated;

-- ==============================================================================
-- 7. ENABLE REALTIME BROADCASTING
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'suggestions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;
  END IF;
END $$;
