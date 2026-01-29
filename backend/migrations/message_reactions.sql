-- Create table for storing message reactions
CREATE TABLE
IF NOT EXISTS message_reactions
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE
(message_id, user_id, emoji)
);