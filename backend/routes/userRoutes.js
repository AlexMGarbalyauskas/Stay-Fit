const express = require('express');
const bcrypt = require('bcrypt');
const { signToken } = require('../config/jwt');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

/* ===============================
   REGISTER
================================ */
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Missing fields' });

  const hash = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, hash],
    function (err) {
      if (err) return res.status(400).json({ error: 'User exists' });
      const token = signToken({ id: this.lastID });
      res.json({ user: { id: this.lastID, username, email }, token });
    }
  );
});

/* ===============================
   LOGIN
================================ */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user.id });
    res.json({ user, token });
  });
});

/* ===============================
   GET ALL USERS (EXCLUDE SELF)
================================ */
router.get('/', auth, (req, res) => {
  db.all(
    'SELECT id, username, profile_picture FROM users WHERE id != ?',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ users: rows });
    }
  );
});

/* ===============================
   GET SINGLE USER BY ID
================================ */
router.get('/:id', auth, (req, res) => {
  db.get(
    'SELECT id, username, bio, profile_picture FROM users WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});

module.exports = router;
