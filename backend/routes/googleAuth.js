const express = require('express');
const passport = require('passport');
require('../config/googleAuth'); // configure Google Passport strategy
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { sendVerificationEmail } = require('../utils/email');
const bcrypt = require('bcrypt');

const router = express.Router();
const EMAIL_WAIT_TIMEOUT_MS = Number(process.env.EMAIL_WAIT_TIMEOUT_MS || 8000);

const allowedFrontendOrigins = [
  'http://localhost:3000',
  'http://192.168.0.16:3000',
  'https://stay-fit-1.onrender.com',
  'https://stay-fit-2.onrender.com',
];

function getDefaultFrontendUrl() {
  return process.env.CLIENT_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined);
}

function sanitizeFrontendOrigin(frontend) {
  if (!frontend) return null;
  try {
    const origin = new URL(frontend).origin;
    return allowedFrontendOrigins.includes(origin) ? origin : null;
  } catch {
    return null;
  }
}

function buildGoogleState(mode, frontend) {
  return JSON.stringify({ mode, frontend: sanitizeFrontendOrigin(frontend) });
}

function parseGoogleState(state) {
  if (!state) return { mode: null, frontend: null };

  try {
    const parsed = JSON.parse(state);
    return {
      mode: parsed?.mode || null,
      frontend: sanitizeFrontendOrigin(parsed?.frontend) || null,
    };
  } catch {
    // Backward compatibility for old plain-string states
    return {
      mode: state,
      frontend: null,
    };
  }
}

// Helper function to generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

async function sendVerificationEmailWithDeadline(email, username, verificationCode, flow) {
  try {
    const result = await Promise.race([
      sendVerificationEmail(email, username, verificationCode),
      new Promise((resolve) => setTimeout(() => resolve(null), EMAIL_WAIT_TIMEOUT_MS)),
    ]);

    if (result === null) {
      console.error('❌ Google flow verification email timed out at route level:', {
        flow,
        email,
        timeoutMs: EMAIL_WAIT_TIMEOUT_MS,
      });
      return false;
    }

    return !!result;
  } catch (error) {
    console.error('❌ Google flow verification email route-level error:', { flow, email, message: error?.message });
    return false;
  }
}

// LOGIN with Google
router.get(
  '/login',
  (req, res, next) => {
    const state = buildGoogleState('login', req.query.frontend);
    passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
  }
);

// REGISTER with Google
router.get(
  '/register',
  (req, res, next) => {
    const state = buildGoogleState('register', req.query.frontend);
    passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
  }
);

// Google OAuth callback - handles both login and register
router.get(
  '/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    // Get the state from the URL to determine if this is login or register
    const parsedState = parseGoogleState(req.query.state);
    const isRegister = parsedState.mode === 'register';
    const frontendFromState = parsedState.frontend;
    
    // Check if this is a new user
    if (req.user.isNewUser) {
      if (!isRegister) {
        // Login route - reject new users
        console.log('❌ New user tried to login instead of register:', req.user.email);
        
        const frontendUrl =
          frontendFromState || getDefaultFrontendUrl();

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

                const frontendUrl =
                  frontendFromState || getDefaultFrontendUrl();

                if (!frontendUrl) {
                  return res.status(500).send('Frontend URL not configured');
                }

                // Send verification email
                const emailSent = await sendVerificationEmailWithDeadline(
                  email,
                  username,
                  verificationCode,
                  'google-register'
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

          const frontendUrl =
            frontendFromState || getDefaultFrontendUrl();

          if (!frontendUrl) {
            return res.status(500).send('Frontend URL not configured');
          }

          const emailSent = await sendVerificationEmailWithDeadline(
            req.user.email,
            req.user.username,
            verificationCode,
            'google-login-unverified'
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

    const frontendUrl =
      frontendFromState || getDefaultFrontendUrl();

    if (!frontendUrl) {
      return res.status(500).send('Frontend URL not configured');
    }

    const userParam = encodeURIComponent(JSON.stringify({ id: req.user.id, username: req.user.username, email: req.user.email }));
    res.redirect(`${frontendUrl}/social-login?token=${token}&user=${userParam}`);
  }
);

module.exports = router;
