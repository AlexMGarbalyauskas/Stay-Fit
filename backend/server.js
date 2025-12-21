require('dotenv').config();
const express = require('express');
const cors = require('./config/cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===============================
// ROUTES
// ===============================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth/google', require('./routes/googleAuth'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/friends', require('./routes/friendsRoutes'));
app.use('/api/messages', require('./routes/messagesRoutes'));

// Health check
app.get('/', (req, res) => res.send('✅ Stay-Fit API is running'));
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

// ===============================
// SOCKET.IO
// ===============================
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

// Socket auth
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Handle messages
io.on('connection', (socket) => {
  const userId = socket.user.id;
  console.log(`🟢 User connected: ${userId}`);
  socket.join(`user:${userId}`);

  socket.on('send_message', ({ receiverId, content }) => {
    if (!content?.trim()) return;

    const createdAt = new Date().toISOString();

    // Save to DB
    db.run(
      'INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)',
      [userId, receiverId, content, createdAt],
      function (err) {
        if (err) return console.error('DB error saving message', err);

        const message = {
          id: this.lastID,
          sender_id: userId,
          receiver_id: receiverId,
          content,
          created_at: createdAt,
        };

        io.to(`user:${receiverId}`).emit('receive_message', message);
        socket.emit('receive_message', message);
      }
    );
  });

  socket.on('disconnect', () => console.log(`🔴 User disconnected: ${userId}`));
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`✅ Server + Socket.IO running on port ${PORT}`)
);
