-- ==============================================================================
-- CULTURAL TEAM — SUPABASE DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- It creates tables, indexes, row-level security (RLS), stored procedures,
-- and enables real-time synchronization for suggestions and upvoting.
-- ==============================================================================

-- 1. Create Suggestions Table
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other Ideas',
  description TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  is_approved BOOLEAN NOT NULL DEFAULT true,
  
  -- Validation constraints
  CONSTRAINT title_length CHECK (char_length(trim(title)) >= 2 AND char_length(title) <= 120),
  CONSTRAINT description_length CHECK (description IS NULL OR char_length(description) <= 500),
  CONSTRAINT valid_category CHECK (
    category IN (
      'Cultural Events',
      'Music and Dance',
      'Competitions',
      'Parties and Celebrations',
      'Workshops',
      'Other Ideas'
    )
  ),
  CONSTRAINT upvotes_non_negative CHECK (upvotes >= 0)
);

-- 2. Create Suggestion Votes Table (to track unique student votes per device/token)
CREATE TABLE IF NOT EXISTS public.suggestion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
  voter_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Prevent double voting from same voter token
  CONSTRAINT unique_suggestion_voter UNIQUE (suggestion_id, voter_token)
);

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON public.suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_upvotes ON public.suggestions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON public.suggestions(category);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_lookup ON public.suggestion_votes(suggestion_id, voter_token);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Allow public (anon and authenticated) to view all approved suggestions
DROP POLICY IF EXISTS "Public can view approved suggestions" ON public.suggestions;
CREATE POLICY "Public can view approved suggestions"
  ON public.suggestions
  FOR SELECT
  TO public
  USING (is_approved = true);

-- Allow public to submit new suggestions
DROP POLICY IF EXISTS "Public can insert suggestions" ON public.suggestions;
CREATE POLICY "Public can insert suggestions"
  ON public.suggestions
  FOR INSERT
  TO public
  WITH CHECK (
    char_length(trim(title)) >= 2 AND 
    char_length(title) <= 120 AND
    (description IS NULL OR char_length(description) <= 500)
  );

-- Allow public to see if their voter_token has voted on suggestions
DROP POLICY IF EXISTS "Public can view votes" ON public.suggestion_votes;
CREATE POLICY "Public can view votes"
  ON public.suggestion_votes
  FOR SELECT
  TO public
  USING (true);

-- ==============================================================================
-- 5. ATOMIC STORED PROCEDURES (SECURITY DEFINER)
-- ==============================================================================

-- Stored procedure to toggle / cast an upvote safely without race conditions
CREATE OR REPLACE FUNCTION public.toggle_upvote(p_suggestion_id UUID, p_voter_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already_voted BOOLEAN;
  v_new_votes INTEGER;
  v_action TEXT;
BEGIN
  -- Validate inputs
  IF p_suggestion_id IS NULL OR trim(p_voter_token) = '' THEN
    RAISE EXCEPTION 'Invalid suggestion ID or voter token';
  END IF;

  -- Check if already voted
  SELECT EXISTS(
    SELECT 1 FROM public.suggestion_votes 
    WHERE suggestion_id = p_suggestion_id AND voter_token = p_voter_token
  ) INTO v_already_voted;

  IF v_already_voted THEN
    -- Remove the vote (Toggle off)
    DELETE FROM public.suggestion_votes 
    WHERE suggestion_id = p_suggestion_id AND voter_token = p_voter_token;

    UPDATE public.suggestions
    SET upvotes = GREATEST(0, upvotes - 1)
    WHERE id = p_suggestion_id
    RETURNING upvotes INTO v_new_votes;

    v_action := 'removed';
  ELSE
    -- Add the vote
    INSERT INTO public.suggestion_votes (suggestion_id, voter_token)
    VALUES (p_suggestion_id, p_voter_token);

    UPDATE public.suggestions
    SET upvotes = upvotes + 1
    WHERE id = p_suggestion_id
    RETURNING upvotes INTO v_new_votes;

    v_action := 'added';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action,
    'upvotes', v_new_votes,
    'hasVoted', (v_action = 'added')
  );
END;
$$;

-- Grant execution to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.toggle_upvote(UUID, TEXT) TO anon, authenticated;

-- ==============================================================================
-- 6. ENABLE SUPABASE REALTIME
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
