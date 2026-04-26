//PURPOSE:  server.js is the main entry point for the 
// Stay-Fit backend. 
// It sets up the Express server, configures 
// middleware, defines API routes, 
// and initializes Socket.IO for real-time communication. 
// The server handles user authentication, messaging, notifications, 
// and other core functionalities of the Stay-Fit application. 
// It also includes error handling and graceful shutdown logic to 
// ensure stability and reliability.


//const
const express = require('express');
const cors = require('./config/cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');
require('dotenv').config({ override: true });
const app = express();
//const end 




// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ===== Middleware end =====



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
app.use('/api/ai', require('./routes/aiRoutes'));
// ===== Routes end =====




// Health check
app.get('/', (req, res) => res.send('Stay-Fit API running'));
// Health check end




//block 1 
//Socket.IO 
const server = http.createServer(app);
const FRONTEND_URLS = [
  'http://localhost:3000',
  'http://192.168.0.16:3000',
  'https://stay-fit-1.onrender.com',
  'https://stay-fit-2.onrender.com',
];
//block 1 end




//block 2
const io = new Server(server, {
  cors: { origin: FRONTEND_URLS, credentials: true },
});
//block 2 end





//block 3
io.use((socket, next) => {

  try {
    // Expect token in handshake auth
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));

    // Verify token and attach user info to socket
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    socket.user = decoded;
    next();

    // Optionally, you could also check if the user still exists in the database here
  } catch (err) {
    next(new Error('Invalid token'));
  }
});
//block 3 end







// Make io available to routes
app.set('io', io);
// Make io available to routes end







//block 4
io.on('connection', (socket) => {
  try {

    // Join a room for the user to receive direct messages and notifications
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);
    socket.join(`user:${userId}`);

    // Handle incoming messages
    socket.on('send_message', ({ receiverId, content, messageType, mediaUrl, encrypted, iv, isEncrypted }) => {
      try {
        const type = messageType || (mediaUrl ? 'gif' : 'text');
        const cleanedContent = (content || '').trim();
        if (!cleanedContent && !mediaUrl && !encrypted) return; // need something to send

        // Stop messaging when either side has blocked the other.
        db.get(
          `SELECT
            EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blockedByReceiver,
            EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blockedBySender`,
          [receiverId, userId, userId, receiverId],
          (blockErr, blockRow) => {
            if (blockErr) {
              console.error('Error checking message block status:', blockErr);
              return;
            }

            // If either side has blocked the other, prevent sending the message and notify the sender
            const blockedByReceiver = !!blockRow?.blockedByReceiver;
            const blockedBySender = !!blockRow?.blockedBySender;
            if (blockedByReceiver || blockedBySender) {
              socket.emit('message:blocked', {
                receiverId,
                reason: blockedByReceiver ? 'blocked_by_receiver' : 'blocked_by_you',
              });
              return;
            }

            // Save message to database
            const createdAt = new Date().toISOString();
            const finalContent = cleanedContent || (mediaUrl ? '[gif]' : '');
        
            // Handle encrypted messages
            const encryptedContent = isEncrypted ? encrypted : null;
            const encryptedIv = isEncrypted ? iv : null;
            const isEncryptedFlag = isEncrypted ? 1 : 0;

            // Insert message into database
            db.run(
              'INSERT INTO messages (sender_id, receiver_id, content, message_type, media_url, encrypted_content, iv, is_encrypted, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [userId, receiverId, finalContent, type, mediaUrl || null, encryptedContent, encryptedIv, isEncryptedFlag, createdAt],
              function (err) {
                if (err) {
                  console.error('Error saving message:', err);
                  return;
                }
                const messageId = this.lastID;

                // Load sender's profile picture to include in the message event
                db.get('SELECT profile_picture FROM users WHERE id = ?', [userId], (profileErr, senderRow) => {
                  if (profileErr) {
                    console.error('Error loading sender profile picture:', profileErr);
                  }

                  // Emit message to receiver and sender
                  const message = {
                    id: messageId,
                    sender_id: userId,
                    receiver_id: receiverId,
                    content: finalContent,
                    message_type: type,
                    media_url: mediaUrl || null,
                    encrypted_content: encryptedContent,
                    iv: encryptedIv,
                    is_encrypted: isEncryptedFlag,
                    created_at: createdAt,
                    sender_profile_picture: senderRow?.profile_picture || null
                  };

                  // Emit the message to the receiver's room and also back to the sender for confirmation
                  io.to(`user:${receiverId}`).emit('receive_message', message);
                  socket.emit('receive_message', message);

                  // Create a notification for the receiver
                  const preview = mediaUrl ? '[GIF]' : finalContent.slice(0, 200);
                  db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [receiverId, 'message', JSON.stringify({ fromUserId: userId, messageId: message.id, content: preview })], (err) => {
                    if (err) console.error('Failed to create message notification', err);
                    // include preview content in the socket event for toast
                    io.to(`user:${receiverId}`).emit('notification:new', { type: 'message', fromUserId: userId, messageId: message.id, content: preview });
                  });
                });
              }
            );
          }
        );

        // Optionally, you could also emit a typing indicator event here when the user is typing
      } catch (err) {
        console.error('Error handling send_message:', err);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });

    // Handle socket errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });

    // You can add more event handlers here for other real-time features like notifications,
    //  friend requests, etc.
  } catch (err) {
    console.error('Error in socket connection handler:', err);
  }
});
//block 4 end







// ===== Start server =====
const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
// ===== Start server end =====






//block 5
// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
//block 5 end






//block 6
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Continue running instead of crashing
});
//block 6 end






//block 7
// Graceful shutdown
process.on('SIGTERM', () => {

  // Close server and exit process
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
//block 7 end

module.exports = { app, server };