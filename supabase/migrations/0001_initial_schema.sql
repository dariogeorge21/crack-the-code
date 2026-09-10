-- ==============================================================================
-- CRACK THE LOCK (ASTHRA 11.0) - SUPABASE SCHEMA & SEED SCRIPT
-- Copy and paste this script into your Supabase Dashboard -> SQL Editor and Run!
-- ==============================================================================

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_number INT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  team_code VARCHAR(10) UNIQUE NOT NULL,
  current_level INT DEFAULT 1,
  started_at TIMESTAMPTZ,
  round1_answer TEXT,
  first_digit INT,
  master_code VARCHAR(10),
  completed_level1_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Game State / Session Table (For instant reset propagation)
CREATE TABLE IF NOT EXISTS public.game_state (
  id INT PRIMARY KEY DEFAULT 1,
  game_session_id UUID DEFAULT gen_random_uuid(),
  reset_counter INT DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize game state row if not exists
INSERT INTO public.game_state (id, game_session_id, reset_counter, last_reset_at)
VALUES (1, gen_random_uuid(), 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Anon Access (Read and Update by Code)
DROP POLICY IF EXISTS "Public can view teams" ON public.teams;
CREATE POLICY "Public can view teams" ON public.teams
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update teams" ON public.teams;
CREATE POLICY "Public can update teams" ON public.teams
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view game state" ON public.game_state;
CREATE POLICY "Public can view game state" ON public.game_state
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update game state" ON public.game_state;
CREATE POLICY "Public can update game state" ON public.game_state
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed 11 Teams with initial unique 3-Digit Codes
INSERT INTO public.teams (team_number, team_name, team_code, current_level)
VALUES
  (1, 'Team 01', '142', 1),
  (2, 'Team 02', '285', 1),
  (3, 'Team 03', '319', 1),
  (4, 'Team 04', '473', 1),
  (5, 'Team 05', '528', 1),
  (6, 'Team 06', '641', 1),
  (7, 'Team 07', '739', 1),
  (8, 'Team 08', '814', 1),
  (9, 'Team 09', '926', 1),
  (10, 'Team 10', '357', 1),
  (11, 'Team 11', '682', 1)
ON CONFLICT (team_number) DO UPDATE
SET
  team_name = EXCLUDED.team_name,
  team_code = EXCLUDED.team_code;
