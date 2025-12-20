require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const passport = require('./config/googleAuth');

const app = express();

/* ===============================
   TRUST PROXY (IMPORTANT FOR RENDER)
================================ */
app.set('trust proxy', 1);

/* ===============================
   CORS
================================ */
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://stay-fit-2.onrender.com'],
    credentials: true,
  })
);

/* ===============================
   BODY PARSERS
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   PASSPORT
================================ */
app.use(passport.initialize());

/* ===============================
   REQUEST LOGGING (SAFE)
================================ */
app.use((req, res, next) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  const log = {
    time: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip,
    userAgent: req.headers['user-agent'],
  };

  // Only log user info if authenticated
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
   ROUTES
================================ */
app.use('/api/auth', require('./routes/googleAuth'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/friends', require('./routes/friendsRoutes'));

/* ===============================
   HEALTH CHECK
================================ */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/* ===============================
   404 HANDLER (VERY USEFUL)
================================ */
app.use((req, res) => {
  console.warn('❌ 404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
