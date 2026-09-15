-- ==============================================================================
-- CRACK THE LOCK (ASTHRA 11.0) - MIGRATION 0002: ALPHABET KEY SUPPORT
-- Run this in your Supabase Dashboard -> SQL Editor!
-- Converts first_digit column from INT to VARCHAR(5) so teams can have letter keys (A-Z)
-- ==============================================================================

ALTER TABLE public.teams ALTER COLUMN first_digit TYPE VARCHAR(5);
