const express = require('express');
const passport = require('passport');
require('../config/googleAuth'); // configure passport strategy
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username, email: req.user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect dynamically to the same host as frontend
    const frontendUrl =
      process.env.CLIENT_URL || req.headers.origin || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?token=${token}`);
  }
);

module.exports = router;
