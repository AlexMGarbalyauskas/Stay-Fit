const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// ------------------------------
// FRIEND REQUESTS
// ------------------------------

// Send request
router.post('/request', auth, (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: 'Missing receiverId' });

  db.run(
    'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
    [req.user.id, receiverId],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Request already sent' });
        return res.status(500).json({ error: 'DB error' });
      }
      const requestId = this.lastID;

      // Create a notification for receiver
      db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [receiverId, 'friend_request', JSON.stringify({ fromUserId: req.user.id, requestId })], (err2) => {
        if (err2) console.error('Failed to create notification', err2);

        // Emit socket notification if io available
        try {
          const io = req.app.get('io');
          io && io.to(`user:${receiverId}`).emit('notification:new', { type: 'friend_request', fromUserId: req.user.id, requestId });
        } catch (e) { }

        res.json({ message: 'Request sent', id: requestId });
      });
    }
  );
});

// Get incoming requests
router.get('/requests', auth, (req, res) => {
  db.all(
    `SELECT fr.id, fr.sender_id, u.username, u.nickname
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

// Accept request
router.post('/accept', auth, (req, res) => {
  const { requestId, senderId } = req.body;
  if (!requestId || !senderId) return res.status(400).json({ error: 'Missing data' });

  db.run(
    'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
    [req.user.id, senderId, senderId, req.user.id],
    err => {
      if (err) return res.status(500).json({ error: 'DB error' });

      db.run('DELETE FROM friend_requests WHERE id = ?', [requestId], () => {
        // remove related notification if any
        db.run("DELETE FROM notifications WHERE user_id = ? AND type = 'friend_request' AND data LIKE ?", [req.user.id, `%\"requestId\":${requestId}%`], () => {
          res.json({ message: 'Friend request accepted' });
        });
      });
    }
  );
});

// Reject request
router.post('/reject', auth, (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });

  db.run('DELETE FROM friend_requests WHERE id = ?', [requestId], () => {
    // remove related notification(s)
    db.run("DELETE FROM notifications WHERE user_id = ? AND type = 'friend_request' AND data LIKE ?", [req.user.id, `%\"requestId\":${requestId}%`], () => {
      res.json({ message: 'Friend request rejected' });
    });
  });
});

// Get friends list
router.get('/', auth, (req, res) => {
  db.all(
    `SELECT u.id, u.username, u.profile_picture, u.nickname
     FROM friends f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ friends: rows });
    }
  );
});

// Friend status
router.get('/status/:id', auth, (req, res) => {
  const otherId = req.params.id;

  db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [req.user.id, otherId], (err, row) => {
    if (row) return res.json({ status: 'friends' });

    db.get('SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?', [req.user.id, otherId], (err2, sent) => {
      if (sent) return res.json({ status: 'sent' });
      res.json({ status: 'none' });
    });
  });
});

// Unfriend
router.post('/unfriend', auth, (req, res) => {
  const { friendId } = req.body;
  if (!friendId) return res.status(400).json({ error: 'Missing friendId' });

  db.run(
    'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
    [req.user.id, friendId, friendId, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      // notify the other user that they have been unfriended
      db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [friendId, 'unfriended', JSON.stringify({ byUserId: req.user.id })], (err2) => {
        if (err2) console.error('Failed to create unfriended notification', err2);
        try {
          const io = req.app.get('io');
          io && io.to(`user:${friendId}`).emit('notification:new', { type: 'unfriended', byUserId: req.user.id });
        } catch (e) {}
        res.json({ message: 'Unfriended successfully' });
      });
    }
  );
});

module.exports = router;
