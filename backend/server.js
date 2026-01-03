const express = require('express');
const cors = require('./config/cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

require('dotenv').config();
const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Routes =====
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth/google', require('./routes/googleAuth'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/friends', require('./routes/friendsRoutes'));
app.use('/api/messages', require('./routes/messagesRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));
app.use('/api/posts', require('./routes/postsRoutes'));
app.use('/api/workout-schedules', require('./routes/workoutSchedulesRoutes'));


// Health check
app.get('/', (req, res) => res.send('✅ Stay-Fit API running'));

// ===== Socket.IO =====
const server = http.createServer(app);
const FRONTEND_URLS = [
  'http://localhost:3000',
  'http://192.168.0.16:3000',
  'https://stay-fit-1.onrender.com',
  'https://stay-fit-2.onrender.com',
];

const io = new Server(server, {
  cors: { origin: FRONTEND_URLS, credentials: true },
});

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

// Make io available to routes
app.set('io', io);

io.on('connection', (socket) => {
  try {
    const userId = socket.user.id;
    console.log(`🟢 User connected: ${userId}`);
    socket.join(`user:${userId}`);

    socket.on('send_message', ({ receiverId, content, messageType, mediaUrl }) => {
      try {
        const type = messageType || (mediaUrl ? 'gif' : 'text');
        const cleanedContent = (content || '').trim();
        if (!cleanedContent && !mediaUrl) return; // need something to send

        const createdAt = new Date().toISOString();
        const finalContent = cleanedContent || (mediaUrl ? '[gif]' : '');

        db.run(
          'INSERT INTO messages (sender_id, receiver_id, content, message_type, media_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, receiverId, finalContent, type, mediaUrl || null, createdAt],
          function (err) {
            if (err) {
              console.error('Error saving message:', err);
              return;
            }
            const message = { id: this.lastID, sender_id: userId, receiver_id: receiverId, content: finalContent, message_type: type, media_url: mediaUrl || null, created_at: createdAt };
            io.to(`user:${receiverId}`).emit('receive_message', message);
            socket.emit('receive_message', message);

            // Create a notification for the receiver
            const preview = mediaUrl ? '[GIF]' : finalContent.slice(0, 200);
            db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [receiverId, 'message', JSON.stringify({ fromUserId: userId, messageId: message.id, content: preview })], (err) => {
              if (err) console.error('Failed to create message notification', err);
              // include preview content in the socket event for toast
              io.to(`user:${receiverId}`).emit('notification:new', { type: 'message', fromUserId: userId, messageId: message.id, content: preview });
            });
          }
        );
      } catch (err) {
        console.error('Error handling send_message:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${userId}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  } catch (err) {
    console.error('Error in socket connection handler:', err);
  }
});

// ===== Start server =====
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Continue running instead of crashing
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
