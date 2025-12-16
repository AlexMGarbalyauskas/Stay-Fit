require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const passport = require('./config/googleAuth'); // optional
const googleAuthRoutes = require('./routes/googleAuth'); // optional
const db = require('./db');

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- SESSION & PASSPORT ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'session_secret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ---------- JWT ----------
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth header' });

  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid auth header' });

  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// ---------- MULTER SETUP ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const upload = multer({ storage });

// ---------- ROUTES ----------

// Google OAuth (optional)
app.use('/api/auth', googleAuthRoutes);

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    );
    stmt.run(username, email, hash, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE'))
          return res.status(400).json({ error: 'Username or email already exists' });
        return res.status(500).json({ error: 'DB error' });
      }
      const user = { id: this.lastID, username, email };
      const token = signToken(user);
      res.json({ user, token });
    });
    stmt.finalize();
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  db.get(
    'SELECT id, username, email, password_hash FROM users WHERE email = ?',
    [email],
    async (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(400).json({ error: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

      const user = { id: row.id, username: row.username, email: row.email };
      const token = signToken(user);
      res.json({ user, token });
    }
  );
});

// Protected route - get user info
app.get('/api/me', authMiddleware, (req, res) => {
  const { id } = req.user;

  db.get(
    'SELECT id, username, email, profile_picture, bio, location, created_at FROM users WHERE id = ?',
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });

      // Return full URL if profile_picture exists
      if (row.profile_picture) {
        row.profile_picture = `${req.protocol}://${req.get('host')}${row.profile_picture}`;
      }

      res.json({ user: row });
    }
  );
});

// Upload profile picture
app.post('/api/me/profile-picture', authMiddleware, upload.single('profile_picture'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = `/uploads/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${filePath}`;

  db.run('UPDATE users SET profile_picture = ? WHERE id = ?', [filePath, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ profile_picture: fullUrl }); // return full URL to frontend
  });
});

// Update bio and location
app.post('/api/me/update', authMiddleware, (req, res) => {
  const { bio, location } = req.body || {};
  db.run(
    'UPDATE users SET bio = ?, location = ? WHERE id = ?',
    [bio || '', location || '', req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ bio, location });
    }
  );
});

// ---------- SERVER ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
