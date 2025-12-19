const express = require('express');
const passport = require('../config/googleAuth');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const FRONTEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://stay-fit-2.onrender.com'
  : 'http://localhost:3000';

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Issue JWT directly
    const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${FRONTEND_URL}/social-login?token=${token}`);
  }
);

module.exports = router;
