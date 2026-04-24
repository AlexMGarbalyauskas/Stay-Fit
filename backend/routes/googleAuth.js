//const 
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
//const end 








//block 1 
// List of allowed frontend origins for security - 
// only these will be accepted in the state parameter
const allowedFrontendOrigins = [
  'http://localhost:3000',
  'http://192.168.0.16:3000',
  'https://stay-fit-1.onrender.com',
  'https://stay-fit-2.onrender.com',
];
//block 1 end









//block 2 
//Helper function to get default frontend URL based on environment
function getDefaultFrontendUrl() {
  return process.env.CLIENT_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined);
}
//block 2 end









//block 3
// Helper function to sanitize and validate frontend URLs from state
function sanitizeFrontendOrigin(frontend) {

  // If no frontend provided, return null (will use default)
  if (!frontend) return null;

  // Validate against allowed origins
  try {
    const origin = new URL(frontend).origin;
    return allowedFrontendOrigins.includes(origin) ? origin : null;
  } catch {
    return null;
  }
}
//block 3 end





//block 4
// Helper function to build state parameter for Google OAuth
function buildGoogleState(mode, frontend) {
  return JSON.stringify({ mode, frontend: sanitizeFrontendOrigin(frontend) });
}
//block 4 end







//block 5
// Helper function to parse state parameter from Google OAuth callback
function parseGoogleState(state) {

  // If no state provided, return nulls (will treat as login with default frontend)
  if (!state) return { mode: null, frontend: null };

  // Try to parse JSON state, but fallback to old plain-string format for backward compatibility
  try {
    const parsed = JSON.parse(state);
    return {
      mode: parsed?.mode || null,
      frontend: sanitizeFrontendOrigin(parsed?.frontend) || null,
    };

    // If parsing fails, treat state as plain string (old format)
  } catch {
    // Backward compatibility for old plain-string states
    return {
      mode: state,
      frontend: null,
    };
  }
}
//block 5 end







//block 6
// Helper function to generate verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}
//block 6 end








//block 7 
// Helper function to send verification email with a timeout
async function sendVerificationEmailWithDeadline(email, username, verificationCode, flow) {
  
  // Log the attempt to send a verification email for better observability
  try {
    const result = await Promise.race([
      sendVerificationEmail(email, username, verificationCode),
      new Promise((resolve) => setTimeout(() => resolve(null), EMAIL_WAIT_TIMEOUT_MS)),
    ]);

    // If result is null, it means the email sending timed out
    if (result === null) {
      console.error('❌ Google flow verification email timed out at route level:', {
        flow,
        email,
        timeoutMs: EMAIL_WAIT_TIMEOUT_MS,
      });
      return false;
    }

    // Log successful email sending for better observability
    return !!result;
  } catch (error) {
    console.error('❌ Google flow verification email route-level error:', { flow, email, message: error?.message });
    return false;
  }
}
//block 7 end





//block 8
// LOGIN with Google
// The frontend can specify a "frontend" query parameter to indicate where the user should be redirected after authentication
router.get(
  '/login',
  (req, res, next) => {
    const state = buildGoogleState('login', req.query.frontend);
    passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
  }
);
//block 8 end







//block 9
// REGISTER with Google
// The frontend can specify a "frontend" query parameter to indicate where the user should be redirected after authentication
router.get(
  '/register',

  // For better observability, we log the incoming request and the constructed state before calling passport.authenticate
  (req, res, next) => {
    const state = buildGoogleState('register', req.query.frontend);
    passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
  }
);
//block 9 end








//block 10
// Google OAuth callback - handles both login and register
// The state parameter is used to determine if this is a login or register flow, and where to redirect the user after processing
router.get(
  '/callback',
  
  // For better observability, we log the incoming request query parameters before authentication
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

      // Hash the dummy password before storing the user
      bcrypt.hash(dummyPassword, 10, (err, passwordHash) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).send('Error creating account');
        }


        // Insert the new user into the database with email_verified set to false (0)
        db.run(
          'INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
          [username, email, passwordHash, 0],
          function (err) {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).send('Error creating account');
            }

            // Get the ID of the newly created user
            const newUserId = this.lastID;
            
            // Generate verification code
            const verificationCode = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);


            // Store the verification code in the database
            db.run(
              'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
              [newUserId, verificationCode, expiresAt.toISOString()],
              async (err) => {
                if (err) {
                  console.error('Error storing verification code:', err);
                  return res.status(500).send('Error creating verification code');
                }

                // Get frontend URL from state or use default
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

                // Redirect to frontend with info about email verification
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
      
      // Generate a new verification code and store it in the database
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);



      // Store the new verification code in the database for the existing user
      db.run(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [req.user.id, verificationCode, expiresAt.toISOString()],
        async (err) => {
          if (err) {
            console.error('Error storing verification code:', err);
            return res.status(500).send('Error creating verification code');
          }


          // Get frontend URL from state or use default
          const frontendUrl =
            frontendFromState || getDefaultFrontendUrl();

          if (!frontendUrl) {
            return res.status(500).send('Frontend URL not configured');
          }


          // Send verification email to existing user
          const emailSent = await sendVerificationEmailWithDeadline(
            req.user.email,
            req.user.username,
            verificationCode,
            'google-login-unverified'
          );


          // Redirect to frontend with info about email verification
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
    
    // Generate JWT token for the user
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


    // Redirect to frontend with JWT token and user info
    const userParam = encodeURIComponent(JSON.stringify({ id: req.user.id, username: req.user.username, email: req.user.email }));
    res.redirect(`${frontendUrl}/social-login?token=${token}&user=${userParam}`);
  }
);
//block 10 end



module.exports = router;
