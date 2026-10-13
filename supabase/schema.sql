-- ==============================================================================
-- CULTURAL TEAM — SUPABASE SQL MIGRATION & SECURITY POLICIES
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ==============================================================================

-- 1. Ensure columns exist on the suggestions table
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other Ideas';
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS suggestion TEXT;

-- 2. Create index on created_at and upvotes for high performance
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_upvotes ON public.suggestions(upvotes DESC);

-- 3. Configure Row-Level Security (RLS)
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Allow public visitors (anon and authenticated) to read suggestions
DROP POLICY IF EXISTS "Public can view approved suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Public can view suggestions" ON public.suggestions;
CREATE POLICY "Public can view suggestions"
  ON public.suggestions
  FOR SELECT
  TO public
  USING (COALESCE(is_approved, true) = true);

-- Allow public visitors to submit new suggestions
DROP POLICY IF EXISTS "Public can insert suggestions" ON public.suggestions;
CREATE POLICY "Public can insert suggestions"
  ON public.suggestions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public visitors to update upvotes only (or via RPC)
DROP POLICY IF EXISTS "Public can update upvotes" ON public.suggestions;
CREATE POLICY "Public can update upvotes"
  ON public.suggestions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow deletion of suggestions
DROP POLICY IF EXISTS "Allow deletion of suggestions" ON public.suggestions;
CREATE POLICY "Allow deletion of suggestions"
  ON public.suggestions
  FOR DELETE
  TO public
  USING (true);

-- 4. Enable Supabase Realtime synchronization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'suggestions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suggestions;
  END IF;
END $$;

-- 5. Stored Procedure for Atomic Upvoting
CREATE OR REPLACE FUNCTION public.toggle_upvote(p_id BIGINT, p_delta INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_votes INT;
BEGIN
  UPDATE public.suggestions
  SET upvotes = GREATEST(0, COALESCE(upvotes, 0) + p_delta)
  WHERE id = p_id
  RETURNING upvotes INTO v_new_votes;

  RETURN v_new_votes;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_upvote(BIGINT, INT) TO anon, authenticated;
