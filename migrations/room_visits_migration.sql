-- Create room_visits table to track user room visits
CREATE TABLE IF NOT EXISTS room_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_room_visits_user_id ON room_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_room_visits_visited_at ON room_visits(visited_at DESC);

-- Add foreign key constraints
ALTER TABLE room_visits
  ADD CONSTRAINT fk_room_visits_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_room_visits_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
