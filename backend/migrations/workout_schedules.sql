-- Create workout schedules table
CREATE TABLE IF NOT EXISTS workout_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  reminder_time TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Create workout schedule participants table
CREATE TABLE IF NOT EXISTS workout_schedule_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  responded_at TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES workout_schedules(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(schedule_id, user_id)
);
