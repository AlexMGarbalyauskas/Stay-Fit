const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const DB_FILE = process.env.DATABASE_FILE || path.join(__dirname, 'data.sqlite');

// Ensure directory exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error('DB connection error', err);
  else console.log('✅ SQLite DB connected');
});

// Initialize tables
const initSql = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  profile_picture TEXT,
  bio TEXT,
  location TEXT,
  nickname TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  data TEXT,
  read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(initSql, (err) => {
  if (err) console.error('DB init error', err);

  // Ensure 'nickname' column exists (safe for upgrades)
  db.all("PRAGMA table_info('users')", (err2, cols) => {
    if (err2) return console.error('Failed to check users table info', err2);
    const hasNickname = cols && cols.some(c => c.name === 'nickname');
    if (!hasNickname) {
      db.run("ALTER TABLE users ADD COLUMN nickname TEXT", err3 => {
        if (err3) console.error('Failed to add nickname column', err3);
        else console.log('✅ Added nickname column to users');
      });
    }
  });
});

module.exports = db;
