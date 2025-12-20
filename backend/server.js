require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const passport = require('./config/googleAuth');

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors({
  origin: ['http://localhost:3000', 'https://stay-fit-2.onrender.com'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

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
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
