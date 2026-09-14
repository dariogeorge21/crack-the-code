-- ==============================================================================
-- CRACK THE LOCK (ASTHRA 11.0) - ROUND 4 & VICTORY TIME SPLIT TRACKING MIGRATION
-- Run this in Supabase Dashboard -> SQL Editor to add explicit split timestamp column for Level 4.
-- ==============================================================================

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS completed_level4_at TIMESTAMPTZ;
