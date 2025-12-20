require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const passport = require('./config/googleAuth');

const app = express();

/* ===============================
   CORS
================================ */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://stay-fit-2.onrender.com',
    'https://stay-fit-1.onrender.com',
  ],
  credentials: true,
}));

/* ===============================
   BODY PARSERS
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   AUTH
================================ */
app.use(passport.initialize());

/* ===============================
   REQUEST LOGGER (SAFE)
================================ */
app.use((req, res, next) => {
  const log = {
    time: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  // Log authenticated users ONLY
  if (req.user) {
    log.user = {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
    };
  }

  console.log('[REQUEST]', JSON.stringify(log));
  next();
});

/* ===============================
   STATIC FILES
================================ */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ===============================
   ROOT ROUTE (IMPORTANT)
================================ */
app.get('/', (req, res) => {
  res.send('✅ Stay-Fit API is running');
});

/* ===============================
   API ROUTES
================================ */
app.use('/api/auth', require('./routes/googleAuth'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/friends', require('./routes/friendsRoutes'));

/* ===============================
   HEALTH CHECK
================================ */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/* ===============================
   404 HANDLER
================================ */
app.use((req, res) => {
  console.warn(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
