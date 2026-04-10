-- Add marked column to cards table
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS marked BOOLEAN DEFAULT FALSE;
