-- Create notifications table
CREATE TABLE
IF NOT EXISTS notifications
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  data TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT
(datetime
('now')),
  FOREIGN KEY
(user_id) REFERENCES users
(id)
);