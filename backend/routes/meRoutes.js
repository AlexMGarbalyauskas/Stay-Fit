const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    'SELECT id, username, email, bio, location, profile_picture, nickname FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});

// UPDATE bio & location
router.post('/update', auth, (req, res) => {
  const { bio, location, nickname } = req.body;
  const updates = [];
  const params = [];

  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (location !== undefined) {
    updates.push('location = ?');
    params.push(location);
  }
  if (nickname !== undefined) {
    updates.push('nickname = ?');
    params.push(nickname);
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });

    db.get(
      'SELECT id, username, email, bio, location, profile_picture, nickname FROM users WHERE id = ?',
      [req.user.id],
      (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Failed to fetch updated user' });
        res.json({ user: row });
      }
    );
  });
});

// UPLOAD profile picture
router.post('/profile-picture', auth, upload.single('profile_picture'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const imagePath = `/uploads/profile_pics/${req.file.filename}`;
  db.run(
    'UPDATE users SET profile_picture = ? WHERE id = ?',
    [imagePath, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to save profile picture' });

      db.get(
        'SELECT id, username, email, bio, location, profile_picture FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err || !row) return res.status(500).json({ error: 'Failed to fetch user' });
          res.json({ user: row });
        }
      );
    }
  );
});

module.exports = router;
