const express = require('express');
const passport = require('passport');
require('../config/googleAuth'); // configure Google Passport strategy
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { sendVerificationEmail } = require('../utils/email');
const bcrypt = require('bcrypt');

const router = express.Router();

function resolveFrontendUrl(req) {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL;

  const origin = req.get('origin');
  if (origin) return origin;

  const referer = req.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // no-op
    }
  }

  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return 'https://stay-fit-1.onrender.com';
}

// Helper function to generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// LOGIN with Google
router.get(
  '/login',
  passport.authenticate('google', { scope: ['profile', 'email'], state: 'login' })
);

// REGISTER with Google
router.get(
  '/register',
  passport.authenticate('google', { scope: ['profile', 'email'], state: 'register' })
);

// Google OAuth callback - handles both login and register
router.get(
  '/callback',
  (req, res, next) => {
    console.log('🔁 Google callback hit:', {
      state: req.query?.state,
      hasCode: !!req.query?.code,
      hasError: !!req.query?.error,
      error: req.query?.error,
      errorDescription: req.query?.error_description,
    });
    next();
  },
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    // Get the state from the URL to determine if this is login or register
    const state = req.query.state;
    const isRegister = state === 'register';
    
    // Check if this is a new user
    if (req.user.isNewUser) {
      if (!isRegister) {
        // Login route - reject new users
        console.log('❌ New user tried to login instead of register:', req.user.email);
        
        const frontendUrl = resolveFrontendUrl(req);

        if (!frontendUrl) {
          return res.status(500).send('Frontend URL not configured');
        }

        return res.redirect(`${frontendUrl}/login?error=please_register&email=${encodeURIComponent(req.user.email)}`);
      }

      // Register route - create new user
      console.log('✅ Creating new user:', req.user.email);
      
      const dummyPassword = 'google_' + Date.now();
      const username = req.user.username;
      const email = req.user.email;

      bcrypt.hash(dummyPassword, 10, (err, passwordHash) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).send('Error creating account');
        }

        db.run(
          'INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
          [username, email, passwordHash, 0],
          function (err) {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).send('Error creating account');
            }

            const newUserId = this.lastID;
            
            // Generate verification code
            const verificationCode = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            db.run(
              'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
              [newUserId, verificationCode, expiresAt.toISOString()],
              async (err) => {
                if (err) {
                  console.error('Error storing verification code:', err);
                  return res.status(500).send('Error creating verification code');
                }

                const frontendUrl = resolveFrontendUrl(req);

                if (!frontendUrl) {
                  return res.status(500).send('Frontend URL not configured');
                }

                // Send verification email
                const emailSent = await sendVerificationEmail(
                  email,
                  username,
                  verificationCode
                );

                const userParam = encodeURIComponent(JSON.stringify({ 
                  id: newUserId, 
                  username, 
                  email 
                }));
                res.redirect(`${frontendUrl}/verify-email?user=${userParam}&isGoogleSignup=true&emailSent=${emailSent}`);
              }
            );
          }
        );
      });
      return;
    }

    // Existing user
    console.log('🔍 Google OAuth callback for user:', { 
      id: req.user.id, 
      email: req.user.email, 
      email_verified: req.user.email_verified 
    });

    // Check if email is verified
    if (!req.user.email_verified) {
      console.log('⚠️  Email not verified, sending verification email...');
      
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      db.run(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [req.user.id, verificationCode, expiresAt.toISOString()],
        async (err) => {
          if (err) {
            console.error('Error storing verification code:', err);
            return res.status(500).send('Error creating verification code');
          }

          const frontendUrl = resolveFrontendUrl(req);

          if (!frontendUrl) {
            return res.status(500).send('Frontend URL not configured');
          }

          const emailSent = await sendVerificationEmail(
            req.user.email,
            req.user.username,
            verificationCode
          );

          const userParam = encodeURIComponent(JSON.stringify({ 
            id: req.user.id, 
            username: req.user.username, 
            email: req.user.email 
          }));
          res.redirect(`${frontendUrl}/verify-email?user=${userParam}&isGoogleSignup=true&emailSent=${emailSent}`);
        }
      );
      return;
    }

    // Email already verified, log in
    console.log('✅ Email already verified, logging in user...');
    
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign(
      {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const frontendUrl = resolveFrontendUrl(req);

    if (!frontendUrl) {
      return res.status(500).send('Frontend URL not configured');
    }

    const userParam = encodeURIComponent(JSON.stringify({ id: req.user.id, username: req.user.username, email: req.user.email }));
    res.redirect(`${frontendUrl}/social-login?token=${token}&user=${userParam}`);
  }
);

module.exports = router;
