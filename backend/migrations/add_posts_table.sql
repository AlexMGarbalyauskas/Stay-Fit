-- Migration: add posts table
CREATE TABLE
IF NOT EXISTS posts
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  caption TEXT,
  media_path TEXT NOT NULL,
  media_type TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);