-- Add banner_url column to cards table
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT '';
