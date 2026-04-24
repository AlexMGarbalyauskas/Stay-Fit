//const imports and setup
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendVerificationEmail, getEmailDiagnostics } = require('../utils/email');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const EMAIL_WAIT_TIMEOUT_MS = Number(process.env.EMAIL_WAIT_TIMEOUT_MS || 8000);
//consts end







// block 1 function generate 
// Helper function to generate a 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
//block 1 end 






//block 2 function sendVerificationEmailWithDeadline
// Helper function to send verification email with a timeout to prevent hanging routes
async function sendVerificationEmailWithDeadline(email, username, verificationCode, flow) {
  
  try {
    // Use Promise
    const result = await Promise.race([
      sendVerificationEmail(email, username, verificationCode),
      new Promise((resolve) => setTimeout(() => resolve(null), EMAIL_WAIT_TIMEOUT_MS)),
    ]);

    // If result is null, it means the email sending timed out
    if (result === null) {
      console.error('❌ Verification email timed out at route level:', {
        flow,
        email,
        timeoutMs: EMAIL_WAIT_TIMEOUT_MS,
      });
      return false;
    }

    // Log the result of the email sending attempt
    return !!result;
  } catch (error) {
    console.error('❌ Verification email route-level error:', { flow, email, message: error?.message });
    return false;
  }
}






//block 3 function requireEmailDebugToken
// Middleware to protect routes with an email debug token
function requireEmailDebugToken(req, res, next) {
  // For security, the token should be a long random 
  // string set in environment variables, not something guessable
  const token = process.env.EMAIL_DEBUG_TOKEN;
  if (!token) return res.status(404).json({ error: 'Not found' });

  // Expect the token to be sent in a custom header for better security than query params
  const provided = req.headers['x-email-debug-token'];
  if (!provided || provided !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // If the token is valid, proceed to the next middleware or route handler
  next();
}
//block 3 end







//block 4 router.post('/register')
// REGISTER
// This route handles user registration. It validates the input, 
// checks for existing users, hashes the password, creates a new user record, 
// generates an email verification token, and sends a verification email.
router.post('/register', async (req, res) => {


  // Extract and validate the username, email, and password from the request body
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });


  // Check if the email is already registered to prevent duplicate accounts
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (row) return res.status(400).json({ error: 'Email already exists' });

    // Hash the password using bcrypt before storing it in the database for security
    const hash = await bcrypt.hash(password, 10);

    // Insert the new user into the database and create an email verification token
    db.run(
      'INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
      [username, email, hash, 0],

      // The callback function for db.run uses a regular function to access 
      // 'this.lastID' for the new user ID
      function (err) {
        if (err) return res.status(500).json({ error: 'DB error' });


        // Generate a verification code and calculate the expiration time for the token
        const userId = this.lastID;
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Insert the email verification token into the database
        db.run(
          'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
          [userId, verificationCode, expiresAt.toISOString()],
          async (insertErr) => {
            if (insertErr) return res.status(500).json({ error: 'DB error' });


            // Send the verification email and log the result
            const emailSent = await sendVerificationEmailWithDeadline(email, username, verificationCode, 'register');
            if (!emailSent) {
              console.error('❌ Verification email failed to send during register:', {
                userId,
                email,
                username,
                flow: 'register',
              });
            }

            // Respond with the user info and email sending status, 
            // but do not log the verification code for security reasons
            res.json({
              user: { id: userId, username, email },
              emailSent,
              requiresVerification: true
            });
          }
        );
      }
    );
  });
});
//block 4 end







//block 5 router.post('/login')
// LOGIN
// This route handles user login. It accepts either email or username as the login identifier,
router.post('/login', (req, res) => {

  // Extract the login identifier and password from the request body
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'All fields are required' });


  // Query the database for a user matching the provided email or username
  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [login, login], async (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Compare the provided password with the stored password hash using bcrypt
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    // Check if the user's email is verified before allowing login
    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        user: { id: user.id, username: user.username, email: user.email }
      });
    }

    // If login is successful and email is verified, generate a JWT token for the user
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
  });
});
//block 5 end









//block 6 router.post('/verify-email-token')
// VERIFY EMAIL TOKEN (from email link)
// This route verifies the email using a token sent 
// in the verification email. It checks the token's validity and expiration, 
// marks the email as verified, deletes the token, and logs the user in by returning a JWT.
router.post('/verify-email-token', (req, res) => {
  const { token, userId } = req.body;
  
  console.log('🔍 Verify email token request:', { token: token?.substring(0, 10) + '...', userId });
  

  if (!token || !userId) {
    return res.status(400).json({ error: 'Token and userId are required' });
  }

  // Check if token exists
  db.get(
    'SELECT * FROM email_verification_tokens WHERE token = ? AND user_id = ?',
    [token, userId],
    (err, tokenRecord) => {
      if (err) {
        console.error('❌ DB error finding token:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      if (!tokenRecord) {
        console.log('❌ No token found for:', { token: token?.substring(0, 10) + '...', userId });
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      console.log('✅ Token found:', { id: tokenRecord.id, expires_at: tokenRecord.expires_at });

      // Validate expiration in JS for reliability
      const expiresAt = tokenRecord.expires_at ? new Date(tokenRecord.expires_at) : null;
      if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
        console.log('❌ Token expired:', { expiresAt, now: new Date() });
        return res.status(400).json({ error: 'Verification token expired' });
      }

      console.log('✅ Token valid, updating user...');

      // Mark email as verified
      db.run(
        'UPDATE users SET email_verified = 1 WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            console.error('❌ DB error updating user:', err);
            return res.status(500).json({ error: 'DB error' });
          }

          console.log('✅ User updated, rows changed:', this.changes);

          // Delete the used token
          db.run(
            'DELETE FROM email_verification_tokens WHERE id = ?',
            [tokenRecord.id],
            () => {
              console.log('✅ Token deleted');
              
              // Create JWT token for login
              db.get(
                'SELECT id, username, email FROM users WHERE id = ?',
                [userId],
                (err, user) => {
                  if (err) {
                    console.error('❌ DB error fetching user:', err);
                    return res.status(500).json({ error: 'DB error' });
                  }
                  if (!user) {
                    console.log('❌ User not found after update');
                    return res.status(404).json({ error: 'User not found' });
                  }

                  const jwtToken = jwt.sign(
                    { id: user.id, username: user.username, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                  );

                  console.log('✅ Email verified successfully for user:', user.email);

                  res.json({
                    message: 'Email verified successfully',
                    user: { id: user.id, username: user.username, email: user.email },
                    token: jwtToken
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});
//block 6 end








// block 7 router.post('/verify-email-code')
// VERIFY EMAIL CODE (from email)
router.post('/verify-email-code', (req, res) => {
  const { code, userId } = req.body;
  
  console.log('🔍 Verify email code request:', { code, userId });
  
  if (!code || !userId) {
    return res.status(400).json({ error: 'Code and userId are required' });
  }

  // Check if code exists and matches
  db.get(
    'SELECT * FROM email_verification_tokens WHERE token = ? AND user_id = ?',
    [code, userId],
    (err, tokenRecord) => {
      if (err) {
        console.error('❌ DB error finding code:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      if (!tokenRecord) {
        console.log('❌ No code found for:', { code, userId });
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      console.log('✅ Code found:', { id: tokenRecord.id, expires_at: tokenRecord.expires_at });

      // Validate expiration in JS for reliability
      const expiresAt = tokenRecord.expires_at ? new Date(tokenRecord.expires_at) : null;
      if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
        console.log('❌ Code expired:', { expiresAt, now: new Date() });
        return res.status(400).json({ error: 'Verification code expired' });
      }

      console.log('✅ Code valid, updating user...');

      // Mark email as verified
      db.run(
        'UPDATE users SET email_verified = 1 WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            console.error('❌ DB error updating user:', err);
            return res.status(500).json({ error: 'DB error' });
          }

          console.log('✅ User updated, rows changed:', this.changes);

          // Delete all used codes for this user
          db.run(
            'DELETE FROM email_verification_tokens WHERE user_id = ?',
            [userId],
            () => {
              console.log('✅ Codes deleted for user');
              
              // Create JWT token for login
              db.get(
                'SELECT id, username, email FROM users WHERE id = ?',
                [userId],
                (err, user) => {
                  if (err) {
                    console.error('❌ DB error fetching user:', err);
                    return res.status(500).json({ error: 'DB error' });
                  }
                  if (!user) {
                    console.log('❌ User not found after update');
                    return res.status(404).json({ error: 'User not found' });
                  }

                  const jwtToken = jwt.sign(
                    { id: user.id, username: user.username, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                  );

                  console.log('✅ Email verified successfully for user:', user.email);

                  res.json({
                    message: 'Email verified successfully',
                    user: { id: user.id, username: user.username, email: user.email },
                    token: jwtToken
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});
// block 7 end








// block 8 router.post('/resend-verification-code')
// RESEND VERIFICATION CODE
// This route allows users to request a new verification code 
// if they haven't received the email or if the previous code expired.
router.post('/resend-verification-code', (req, res) => {
  // Extract the userId from the request body to identify 
  // which user's verification code to resend
  const { userId } = req.body;

  // Validate that the userId is provided in the request
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Query the database for the user's email and username using the provided userId
  db.get('SELECT id, username, email FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate a new verification code and calculate the expiration time for the token
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert the new verification code into the database, 
    // replacing any existing codes for this user
    db.run(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, verificationCode, expiresAt.toISOString()],
      async (insertErr) => {
        if (insertErr) return res.status(500).json({ error: 'DB error' });

        const emailSent = await sendVerificationEmailWithDeadline(user.email, user.username, verificationCode, 'resend-verification-code');
        if (!emailSent) {
          console.error('❌ Verification email failed to resend:', {
            userId: user.id,
            email: user.email,
            username: user.username,
            flow: 'resend-verification-code',
          });
        }
        res.json({ emailSent });
      }
    );
  });
});
// block 8 end








// block 9 router.post('/verify-email')
// VERIFY EMAIL (mark email as verified for authenticated users)
// This route allows authenticated users to mark their email as verified without a token,
router.post('/verify-email', auth, (req, res) => {
  // This is a less secure route and should only be used in specific 
  // scenarios, such as after verifying the email through other means. 
  // It directly updates the user's email_verified status in the database.
  db.run(
    'UPDATE users SET email_verified = 1 WHERE id = ?',
    [req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Email verified successfully' });
    }
  );
});
// block 9 end








// block 10 router.get('/verification-status')
// GET EMAIL VERIFICATION STATUS
// This route allows authenticated users to check if their email is verified.
router.get('/verification-status', auth, (req, res) => {
  // Query the database for the email verification status of the authenticated user
  db.get(
    'SELECT email_verified FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ email_verified: !!user.email_verified });
    }
  );
});
// block 10 end








// block 11 router.post('/logout')
// DEBUG: recent email provider diagnostics (requires EMAIL_DEBUG_TOKEN)
// This route provides diagnostics about email providers and recent email 
// sending attempts for debugging purposes.
router.get('/email-debug', requireEmailDebugToken, (req, res) => {

  // Extract an optional 'limit' query parameter to limit the number
  //  of email diagnostics returned, defaulting to 20 if not provided
  const limit = Number(req.query.limit || 20);

  // Respond with the status of email providers and recent email diagnostics,
  res.json({
    providers: {
      mailsender: !!(process.env.MAILSENDER_API_TOKEN || process.env.MAILERSEND_API_KEY),
      resend: !!process.env.RESEND_API_KEY,
      smtp: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    },
    providerMode: (process.env.EMAIL_PROVIDER || '').trim().toLowerCase() || 'auto',
    diagnostics: getEmailDiagnostics(limit),
  });
});
// block 11 end










// block 12 router.post('/email-debug/send-test')
// DEBUG: send a test verification email on demand (requires EMAIL_DEBUG_TOKEN)
router.post('/email-debug/send-test', requireEmailDebugToken, async (req, res) => {

  // Extract the email and optional username from 
  // the request body to send a test verification email
  const { email, username } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });


  // Generate a verification code and attempt to send a test verification email,
  const verificationCode = generateVerificationCode();
  const ok = await sendVerificationEmailWithDeadline(
    email,
    username || 'Debug User',
    verificationCode,
    'debug-send-test'
  );

  // Respond with the result of the email sending attempt and the 
  // verification code for debugging,
  res.json({
    emailSent: ok,
    verificationCode,
  });
});
// block 12 end







// Export the router to be used in the main app
module.exports = router;
