require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://stay-fit-2.onrender.com', // frontend
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   ROUTES
================================ */
app.use('/api/auth', require('./routes/googleAuth'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/friends', require('./routes/friendsRoutes'));

/* ===============================
   HEALTH CHECK (VERY IMPORTANT)
================================ */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ===============================
   SERVE FRONTEND (RENDER)
================================ */
const frontendPath = path.join(__dirname, 'public');

app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
