const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// GET all users (exclude self)
router.get('/', auth, (req, res) => {
  db.all(
    'SELECT id, username, profile_picture, nickname FROM users WHERE id != ?',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ users: rows });
    }
  );
});

// GET single user by ID
router.get('/:id', auth, (req, res) => {
  db.get(
    'SELECT id, username, bio, profile_picture, nickname FROM users WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});

module.exports = router;
