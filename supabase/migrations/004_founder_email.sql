-- Add founder_email column to companies table
-- Run this in Supabase SQL editor: https://app.supabase.com/project/ijjjvdzeoftkoxnvcaie/sql

ALTER TABLE companies ADD COLUMN IF NOT EXISTS founder_email TEXT;
