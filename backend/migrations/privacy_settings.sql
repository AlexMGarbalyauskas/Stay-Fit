-- Add privacy column to users table
ALTER TABLE users ADD COLUMN privacy TEXT DEFAULT 'Public';
