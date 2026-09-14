-- ==============================================================================
-- CRACK THE LOCK (ASTHRA 11.0) - ROUND 2 & 3 TIME SPLIT TRACKING MIGRATION
-- Run this in Supabase Dashboard -> SQL Editor to add explicit split timestamp columns.
-- ==============================================================================

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS completed_level2_at TIMESTAMPTZ;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS completed_level3_at TIMESTAMPTZ;
