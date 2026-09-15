-- ==============================================================================
-- CRACK THE LOCK (ASTHRA 11.0) - ROUND 4 & FINAL SPLIT TRACKING MIGRATION
-- Run this in Supabase Dashboard -> SQL Editor to add explicit split timestamp column.
-- ==============================================================================

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS completed_level4_at TIMESTAMPTZ;

