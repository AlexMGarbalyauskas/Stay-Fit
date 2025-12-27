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
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
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

-- Posts table for videos and other media posts
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  caption TEXT,
  media_path TEXT NOT NULL,
  media_type TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
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

  // Ensure 'title' column exists in posts (safe for upgrades)
  db.all("PRAGMA table_info('posts')", (err4, cols2) => {
    if (err4) return console.error('Failed to check posts table info', err4);
    const hasTitle = cols2 && cols2.some(c => c.name === 'title');
    if (!hasTitle) {
      db.run("ALTER TABLE posts ADD COLUMN title TEXT", err5 => {
        if (err5) console.error('Failed to add title column to posts', err5);
        else console.log('✅ Added title column to posts');
      });
    }
  });

  // Ensure message_type and media_url exist in messages (safe upgrade)
  db.all("PRAGMA table_info('messages')", (err6, cols3) => {
    if (err6) return console.error('Failed to check messages table info', err6);
    const hasType = cols3 && cols3.some(c => c.name === 'message_type');
    if (!hasType) {
      db.run("ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'", err7 => {
        if (err7) console.error('Failed to add message_type column to messages', err7);
        else console.log('✅ Added message_type column to messages');
      });
    }
    const hasMedia = cols3 && cols3.some(c => c.name === 'media_url');
    if (!hasMedia) {
      db.run("ALTER TABLE messages ADD COLUMN media_url TEXT", err8 => {
        if (err8) console.error('Failed to add media_url column to messages', err8);
        else console.log('✅ Added media_url column to messages');
      });
    }
  });
});

module.exports = db;
