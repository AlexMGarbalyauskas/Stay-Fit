const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
const { sendVerificationEmail, getEmailDiagnostics } = require('../utils/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const EMAIL_WAIT_TIMEOUT_MS = Number(process.env.EMAIL_WAIT_TIMEOUT_MS || 8000);

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmailWithDeadline(email, username, verificationCode, flow) {
  try {
    const result = await Promise.race([
      sendVerificationEmail(email, username, verificationCode),
      new Promise((resolve) => setTimeout(() => resolve(null), EMAIL_WAIT_TIMEOUT_MS)),
    ]);

    if (result === null) {
      console.error('❌ Verification email timed out at route level:', {
        flow,
        email,
        timeoutMs: EMAIL_WAIT_TIMEOUT_MS,
      });
      return false;
    }

    return !!result;
  } catch (error) {
    console.error('❌ Verification email route-level error:', { flow, email, message: error?.message });
    return false;
  }
}

function requireEmailDebugToken(req, res, next) {
  const token = process.env.EMAIL_DEBUG_TOKEN;
  if (!token) return res.status(404).json({ error: 'Not found' });

  const provided = req.headers['x-email-debug-token'];
  if (!provided || provided !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// REGISTER
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields are required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (row) return res.status(400).json({ error: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
      [username, email, hash, 0],
      function (err) {
        if (err) return res.status(500).json({ error: 'DB error' });

        const userId = this.lastID;
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        db.run(
          'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
          [userId, verificationCode, expiresAt.toISOString()],
          async (insertErr) => {
            if (insertErr) return res.status(500).json({ error: 'DB error' });

            const emailSent = await sendVerificationEmailWithDeadline(email, username, verificationCode, 'register');
            if (!emailSent) {
              console.error('❌ Verification email failed to send during register:', {
                userId,
                email,
                username,
                flow: 'register',
              });
            }
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

// LOGIN
router.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'All fields are required' });

  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [login, login], async (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid password' });

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        user: { id: user.id, username: user.username, email: user.email }
      });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
  });
});

// VERIFY EMAIL TOKEN (from email link)
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

// RESEND VERIFICATION CODE
router.post('/resend-verification-code', (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  db.get('SELECT id, username, email FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

// VERIFY EMAIL (mark email as verified for authenticated users)
router.post('/verify-email', auth, (req, res) => {
  db.run(
    'UPDATE users SET email_verified = 1 WHERE id = ?',
    [req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Email verified successfully' });
    }
  );
});

// GET EMAIL VERIFICATION STATUS
router.get('/verification-status', auth, (req, res) => {
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

// DEBUG: recent email provider diagnostics (requires EMAIL_DEBUG_TOKEN)
router.get('/email-debug', requireEmailDebugToken, (req, res) => {
  const limit = Number(req.query.limit || 20);
  res.json({
    providers: {
      sendgrid: !!process.env.SENDGRID_API_KEY,
      resend: !!process.env.RESEND_API_KEY,
      smtp: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    },
    diagnostics: getEmailDiagnostics(limit),
  });
});

// DEBUG: send a test verification email on demand (requires EMAIL_DEBUG_TOKEN)
router.post('/email-debug/send-test', requireEmailDebugToken, async (req, res) => {
  const { email, username } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const verificationCode = generateVerificationCode();
  const ok = await sendVerificationEmailWithDeadline(
    email,
    username || 'Debug User',
    verificationCode,
    'debug-send-test'
  );

  res.json({
    emailSent: ok,
    verificationCode,
  });
});

module.exports = router;
