const express = require('express');
const passport = require('passport');
require('../config/googleAuth'); // configure passport strategy

const router = express.Router();

router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    // Google login successful, return JWT
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign({ id: req.user.id, username: req.user.username, email: req.user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/?token=${token}`);
  }
);

module.exports = router;
