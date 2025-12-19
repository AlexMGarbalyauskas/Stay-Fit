const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('../config/passport');
const { signToken } = require('../config/jwt');
const db = require('../db');

const router = express.Router();

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

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

      const token = signToken({ id: user.id });
      res.json({ user, token });
    }
  );
});

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = signToken({ id: req.user.id });
    const FRONTEND =
      process.env.NODE_ENV === 'production'
        ? 'https://stay-fit-2.onrender.com'
        : 'http://localhost:3000';

    res.redirect(`${FRONTEND}/social-login?token=${token}`);
  }
);

module.exports = router;
