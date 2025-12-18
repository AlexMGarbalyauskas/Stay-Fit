require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/googleAuth');
const googleAuthRoutes = require('./routes/googleAuth');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

const app = express();
app.use(express.json());

// ---------- SECURITY HEADERS ----------

app.use(
  helmet({
    contentSecurityPolicy: false, // 🔥 REQUIRED
    crossOriginEmbedderPolicy: false,
  })
);


app.disable('x-powered-by'); // remove X-Powered-By

// ---------- CORS ----------
const allowedOrigins = [
  'http://localhost:3000',
  'https://stay-fit-2.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman/curl
    if (!allowedOrigins.includes(origin)) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// ---------- SESSION ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'session_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      sameSite: 'none' // cross-origin cookies
    }
  })
);

// ---------- PASSPORT ----------
app.use(passport.initialize());
app.use(passport.session());

// ---------- JWT ----------
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ---------- AUTH MIDDLEWARE ----------
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

// ---------- LOGGING MIDDLEWARE ----------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// ---------- ROUTES ----------

// Google OAuth
app.use('/api/auth', googleAuthRoutes);

// ---------- AUTHENTICATION ----------
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
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

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  db.get('SELECT id, username, email, password_hash FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const user = { id: row.id, username: row.username, email: row.email };
    const token = signToken(user);
    res.json({ user, token });
  });
});

// ---------- USERS ----------
app.get('/api/users', authMiddleware, (req, res) => {
  db.all('SELECT id, username, bio, profile_picture FROM users WHERE id != ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ users: rows });
  });
});

app.get('/api/users/:id', authMiddleware, (req, res) => {
  db.get('SELECT id, username, bio, profile_picture FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: row });
  });
});

// ---------- CURRENT USER ----------
app.get('/api/me', authMiddleware, (req, res) => {
  db.get('SELECT id, username, email, bio, location, profile_picture FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ user: row });
  });
});

// ---------- UPDATE CURRENT USER ----------
app.post('/api/me/update', authMiddleware, (req, res) => {
  const { bio, location } = req.body;
  if (!bio && !location) return res.status(400).json({ error: 'Nothing to update' });

  const fields = [];
  const values = [];

  if (bio !== undefined) {
    fields.push('bio = ?');
    values.push(bio);
  }
  if (location !== undefined) {
    fields.push('location = ?');
    values.push(location);
  }
  values.push(req.user.id);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: 'Profile updated' });
  });
});

// ---------- FRIEND REQUESTS ----------
app.post('/api/friends/request', authMiddleware, (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: 'Missing receiverId' });

  const stmt = db.prepare('INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)');
  stmt.run(req.user.id, receiverId, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Request already sent' });
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ message: 'Request sent', id: this.lastID });
  });
  stmt.finalize();
});

app.get('/api/friends/requests', authMiddleware, (req, res) => {
  db.all(
    `SELECT fr.id, fr.sender_id, u.username
     FROM friend_requests fr
     JOIN users u ON u.id = fr.sender_id
     WHERE fr.receiver_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ requests: rows });
    }
  );
});

app.post('/api/friends/accept', authMiddleware, (req, res) => {
  const { requestId, senderId } = req.body;
  if (!requestId || !senderId) return res.status(400).json({ error: 'Missing data' });

  const stmt = db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)');
  stmt.run(req.user.id, senderId, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });

    db.run('DELETE FROM friend_requests WHERE id = ?', [requestId], (err2) => {
      if (err2) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Friend request accepted' });
    });
  });
  stmt.finalize();
});

app.post('/api/friends/reject', authMiddleware, (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });

  db.run('DELETE FROM friend_requests WHERE id = ?', [requestId], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: 'Friend request rejected' });
  });
});

app.get('/api/friends/status/:id', authMiddleware, (req, res) => {
  const otherId = req.params.id;
  db.get(
    `SELECT * FROM friends WHERE 
      (user_id = ? AND friend_id = ?) OR 
      (user_id = ? AND friend_id = ?)`,
    [req.user.id, otherId, otherId, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (row) return res.json({ status: 'friends' });

      db.get(
        `SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?`,
        [req.user.id, otherId],
        (err2, sentRow) => {
          if (err2) return res.status(500).json({ error: 'DB error' });
          if (sentRow) return res.json({ status: 'sent' });
          return res.json({ status: 'none' });
        }
      );
    }
  );
});

app.get('/api/friends', authMiddleware, (req, res) => {
  db.all(
    `SELECT u.id, u.username, u.profile_picture 
     FROM friends f 
     JOIN users u ON (u.id = f.user_id OR u.id = f.friend_id) 
     WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?`,
    [req.user.id, req.user.id, req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ friends: rows });
    }
  );
});

app.post('/api/friends/unfriend', authMiddleware, (req, res) => {
  const { friendId } = req.body;
  if (!friendId) return res.status(400).json({ error: 'Missing friendId' });

  const stmt = db.prepare(
    'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)'
  );
  stmt.run(req.user.id, friendId, friendId, req.user.id, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ message: 'Unfriended successfully' });
  });
  stmt.finalize();
});

// ---------- PROFILE PICTURE UPLOAD ----------
const uploadDir = './uploads/profile_pics';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${req.user.id}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

app.post('/api/me/profile-picture', authMiddleware, upload.single('profile_picture'), (req, res) => {
  try {
    const filePath = `${req.protocol}://${req.get('host')}/uploads/profile_pics/${req.file.filename}`;
    db.run('UPDATE users SET profile_picture = ? WHERE id = ?', [filePath, req.user.id], function (err) {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ profile_picture: filePath });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
