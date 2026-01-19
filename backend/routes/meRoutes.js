const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getTimezoneFromLocation } = require('../utils/timezone');
const bcrypt = require('bcrypt');

const router = express.Router();

// Multer setup for profile pictures
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_pics');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// GET current user
router.get('/', auth, (req, res) => {
  db.get(
    'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone, notifications_enabled FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});

// UPDATE bio & location & nickname (PUT endpoint)
router.put('/', auth, (req, res) => {
  const { bio, location, nickname, privacy, timezone, notifications_enabled } = req.body;
  const updates = [];
  const params = [];

  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (location !== undefined) {
    updates.push('location = ?');
    params.push(location);
    // Auto-set timezone based on location
    const autoTimezone = getTimezoneFromLocation(location);
    updates.push('timezone = ?');
    params.push(autoTimezone);
  }
  if (nickname !== undefined) {
    updates.push('nickname = ?');
    params.push(nickname);
  }
  if (privacy !== undefined) {
    updates.push('privacy = ?');
    params.push(privacy);
  }
  if (timezone !== undefined) {
    updates.push('timezone = ?');
    params.push(timezone);
  }
  if (notifications_enabled !== undefined) {
    updates.push('notifications_enabled = ?');
    params.push(notifications_enabled ? 1 : 0);
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });

    db.get(
      'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone, notifications_enabled FROM users WHERE id = ?',
      [req.user.id],
      (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Failed to fetch updated user' });
        res.json({ user: row });
      }
    );
  });
});

// UPDATE bio & location (legacy POST endpoint for backward compatibility)
router.post('/update', auth, (req, res) => {
  const { bio, location, nickname, privacy, timezone } = req.body;
  const updates = [];
  const params = [];

  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (location !== undefined) {
    updates.push('location = ?');
    params.push(location);
    // Auto-set timezone based on location
    const autoTimezone = getTimezoneFromLocation(location);
    updates.push('timezone = ?');
    params.push(autoTimezone);
  }
  if (nickname !== undefined) {
    updates.push('nickname = ?');
    params.push(nickname);
  }
  if (privacy !== undefined) {
    updates.push('privacy = ?');
    params.push(privacy);
  }
  if (timezone !== undefined) {
    updates.push('timezone = ?');
    params.push(timezone);
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });

    db.get(
      'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone FROM users WHERE id = ?',
      [req.user.id],
      (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Failed to fetch updated user' });
        res.json({ user: row });
      }
    );
  });
});

// UPLOAD profile picture
router.post('/profile-picture', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const imagePath = `/uploads/profile_pics/${req.file.filename}`;
  db.run(
    'UPDATE users SET profile_picture = ? WHERE id = ?',
    [imagePath, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save profile picture' });

      db.get(
        'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err || !row) return res.status(500).json({ error: 'Failed to fetch user' });
          res.json({ profile_picture: row.profile_picture, user: row });
        }
      );
    }
  );
});

// DELETE account
router.delete('/delete', auth, async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password is required' });

  const userId = req.user.id;

  // Verify password
  const userRow = await new Promise((resolve, reject) => {
    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  }).catch(() => null);

  if (!userRow) return res.status(404).json({ error: 'User not found' });
  const ok = await bcrypt.compare(password, userRow.password_hash).catch(() => false);
  if (!ok) return res.status(401).json({ error: 'Invalid password' });

  // Helper to run statement
  const run = (sql, params = []) => new Promise((resolve) => db.run(sql, params, () => resolve()));
  const all = (sql, params = []) => new Promise((resolve) => db.all(sql, params, (err, rows) => resolve(rows || [])));

  // Clean up user data
  const userPosts = await all('SELECT id FROM posts WHERE user_id = ?', [userId]);
  const postIds = userPosts.map(p => p.id);

  // Delete comment likes on user's comments and posts
  await run('DELETE FROM comment_likes WHERE user_id = ?', [userId]);
  if (postIds.length) {
    const placeholders = postIds.map(() => '?').join(',');
    const commentsOnPosts = await all(`SELECT id FROM comments WHERE post_id IN (${placeholders})`, postIds);
    const commentIds = commentsOnPosts.map(c => c.id);
    if (commentIds.length) {
      const ph = commentIds.map(() => '?').join(',');
      await run(`DELETE FROM comment_likes WHERE comment_id IN (${ph})`, commentIds);
      await run(`DELETE FROM comments WHERE id IN (${ph})`, commentIds);
    }
  }

  await run('DELETE FROM comments WHERE user_id = ?', [userId]);
  await run('DELETE FROM likes WHERE user_id = ?', [userId]);
  await run('DELETE FROM saves WHERE user_id = ?', [userId]);
  if (postIds.length) {
    const placeholders = postIds.map(() => '?').join(',');
    await run(`DELETE FROM likes WHERE post_id IN (${placeholders})`, postIds);
    await run(`DELETE FROM saves WHERE post_id IN (${placeholders})`, postIds);
    await run(`DELETE FROM comments WHERE post_id IN (${placeholders})`, postIds);
    await run(`DELETE FROM posts WHERE id IN (${placeholders})`, postIds);
  }

  await run('DELETE FROM friend_requests WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
  await run('DELETE FROM friends WHERE user_id = ? OR friend_id = ?', [userId, userId]);
  await run('DELETE FROM message_reactions WHERE user_id = ?', [userId]);
  await run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
  await run('DELETE FROM notifications WHERE user_id = ?', [userId]);
  await run('DELETE FROM workout_schedules WHERE user_id = ?', [userId]);

  // Finally delete user
  await run('DELETE FROM users WHERE id = ?', [userId]);

  res.json({ message: 'Account deleted' });
});

module.exports = router;
