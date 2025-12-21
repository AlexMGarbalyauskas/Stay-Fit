require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const passport = require('./config/googleAuth');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();

/* ===============================
   CORS (MUST BE FIRST)
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
   AUTH (PASSPORT)
================================ */
app.use(passport.initialize());

/* ===============================
   STATIC FILES
================================ */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ===============================
   ROOT
================================ */
app.get('/', (req, res) => {
  res.send('✅ Stay-Fit API is running');
});

/* ===============================
   API ROUTES (after CORS)
================================ */
app.use('/api/messages', require('./routes/messagesRoutes'));
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
   HTTP + SOCKET.IO
================================ */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://stay-fit-2.onrender.com',
      'https://stay-fit-1.onrender.com',
    ],
    credentials: true,
  },
});

/* ===============================
   SOCKET AUTH (JWT)
================================ */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_secret'
    );

    socket.user = decoded; // { id }
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

/* ===============================
   SOCKET EVENTS
================================ */
io.on('connection', (socket) => {
  const userId = socket.user.id;
  console.log(`🟢 User connected: ${userId}`);

  socket.join(`user:${userId}`);

  socket.on('send_message', ({ receiverId, content }) => {
    if (!content?.trim()) return;

    // Check friendship
    db.get(
      'SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?',
      [userId, receiverId],
      (err, row) => {
        if (!row) return;

        db.run(
          'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
          [userId, receiverId, content],
          function () {
            const message = {
              id: this.lastID,
              sender_id: userId,
              receiver_id: receiverId,
              content,
              created_at: new Date().toISOString(),
            };

            // Send to both sender and receiver
            io.to(`user:${receiverId}`).emit('receive_message', message);
            socket.emit('receive_message', message);
          }
        );
      }
    );
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${userId}`);
  });
});

/* ===============================
   START SERVER
================================ */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);
});
