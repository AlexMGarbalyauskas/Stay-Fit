const express = require('express');
const passport = require('../config/googleAuth');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const { googleId, email, name } = req.user;

    // 🔥 ENSURE USER EXISTS IN DB
    db.get(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) {
          console.error(err);
          return res.redirect('/login');
        }

        // ✅ USER EXISTS
        if (row) {
          const token = jwt.sign(
            { id: row.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          return redirectToFrontend(res, token);
        }

        // ✅ CREATE USER
        const stmt = db.prepare(
          'INSERT INTO users (username, email) VALUES (?, ?)'
        );
        stmt.run(name, email, function (err2) {
          if (err2) {
            console.error(err2);
            return res.redirect('/login');
          }

          const token = jwt.sign(
            { id: this.lastID },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );

          redirectToFrontend(res, token);
        });
        stmt.finalize();
      }
    );
  }
);

function redirectToFrontend(res, token) {
  const FRONTEND_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://stay-fit-2.onrender.com'
      : 'http://localhost:3000';

  res.redirect(`${FRONTEND_URL}/social-login?token=${token}`);
}

module.exports = router;
