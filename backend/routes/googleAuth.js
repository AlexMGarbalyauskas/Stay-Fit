const express = require('express');
const passport = require('../config/googleAuth');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const FRONTEND_URL = process.env.NODE_ENV === 'production'
      ? 'https://stay-fit-2.onrender.com'
      : 'http://localhost:3000';

    res.redirect(`${FRONTEND_URL}/social-login?token=${token}`);
  }
);

module.exports = router;
