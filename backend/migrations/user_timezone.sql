-- Add timezone column to users table
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
