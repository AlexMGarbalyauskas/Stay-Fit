const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

/* ===============================
   GET CURRENT USER PROFILE
================================ */
router.get('/', auth, (req, res) => {
  db.get(
    'SELECT id, username, email, bio, location, profile_picture FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});

/* ===============================
   UPDATE CURRENT USER PROFILE
================================ */
router.post('/update', auth, (req, res) => {
  const { bio, location } = req.body;
  db.run(
    'UPDATE users SET bio = ?, location = ? WHERE id = ?',
    [bio, location, req.user.id],
    () => res.json({ message: 'Profile updated' })
  );
});

module.exports = router;
