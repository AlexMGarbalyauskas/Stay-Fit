const express = require('express');
const passport = require('passport');
require('../config/googleAuth'); // configure Google Passport strategy
const jwt = require('jsonwebtoken');

const router = express.Router();

// Start Google OAuth
router.get(
  '/',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

    // Create JWT token
    const token = jwt.sign(
      {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Determine frontend URL dynamically
    // 1. Use CLIENT_URL env variable (for Render / production)
    // 2. Fall back to localhost in development
    const frontendUrl =
      process.env.CLIENT_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined);

    if (!frontendUrl) {
      console.error('CLIENT_URL not set in environment variables!');
      return res
        .status(500)
        .send('Frontend URL not configured. Please set CLIENT_URL in your environment.');
    }

    // Redirect user to frontend social-login route with token and user info
    const userParam = encodeURIComponent(JSON.stringify({ id: req.user.id, username: req.user.username, email: req.user.email }));
    res.redirect(`${frontendUrl}/social-login?token=${token}&user=${userParam}`);
  }
);

module.exports = router;
