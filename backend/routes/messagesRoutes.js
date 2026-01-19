const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Get chat history with a user
router.get('/:userId', auth, (req, res) => {
  const me = req.user.id;
  const other = req.params.userId;

  db.all(
    `SELECT id, sender_id, receiver_id, content,
            IFNULL(message_type,'text') as message_type,
            media_url,
            encrypted_content,
            iv,
            is_encrypted,
            created_at
     FROM messages
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
     ORDER BY created_at ASC`,
    [me, other, other, me],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ messages: rows });
    }
  );
});

// Get reactions for a message (aggregated)
router.get('/:messageId/reactions', auth, (req, res) => {
  const userId = req.user.id;
  const messageId = req.params.messageId;

  db.all(
    `SELECT emoji, COUNT(*) AS count,
            SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reacted_by_me
     FROM message_reactions
     WHERE message_id = ?
     GROUP BY emoji`,
    [userId, messageId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      const reactions = rows.map(r => ({ emoji: r.emoji, count: r.count, reacted_by_me: r.reacted_by_me ? 1 : 0 }));
      res.json({ messageId, reactions });
    }
  );
});

// Toggle reaction for a message
router.post('/:messageId/reactions', auth, (req, res) => {
  const userId = req.user.id;
  const messageId = req.params.messageId;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Missing emoji' });

  // check participants of message to notify both sides
  db.get('SELECT sender_id, receiver_id FROM messages WHERE id = ?', [messageId], (err, msgRow) => {
    if (err || !msgRow) return res.status(404).json({ error: 'Message not found' });

    db.get('SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?', [messageId, userId, emoji], (err2, row) => {
      const io = req.app.get('io');

      if (row) {
        // remove reaction
        db.run('DELETE FROM message_reactions WHERE id = ?', [row.id], (err3) => {
          if (err3) return res.status(500).json({ error: 'DB error' });

          // send updated aggregates
          db.all(`SELECT emoji, COUNT(*) AS count,
                      SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reacted_by_me
                   FROM message_reactions
                   WHERE message_id = ?
                   GROUP BY emoji`, [userId, messageId], (err4, aggs) => {
            if (err4) return res.status(500).json({ error: 'DB error' });
            const reactions = aggs.map(r => ({ emoji: r.emoji, count: r.count, reacted_by_me: r.reacted_by_me ? 1 : 0 }));
            // emit to participants
            io.to(`user:${msgRow.sender_id}`).emit('reaction:update', { messageId, reactions });
            io.to(`user:${msgRow.receiver_id}`).emit('reaction:update', { messageId, reactions });
            res.json({ messageId, reactions });
          });
        });
      } else {
        // add reaction
        db.run('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)', [messageId, userId, emoji], function (err5) {
          if (err5) return res.status(500).json({ error: 'DB error' });

          db.all(`SELECT emoji, COUNT(*) AS count,
                      SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reacted_by_me
                   FROM message_reactions
                   WHERE message_id = ?
                   GROUP BY emoji`, [userId, messageId], (err6, aggs) => {
            if (err6) return res.status(500).json({ error: 'DB error' });
            const reactions = aggs.map(r => ({ emoji: r.emoji, count: r.count, reacted_by_me: r.reacted_by_me ? 1 : 0 }));
            // emit to participants
            io.to(`user:${msgRow.sender_id}`).emit('reaction:update', { messageId, reactions });
            io.to(`user:${msgRow.receiver_id}`).emit('reaction:update', { messageId, reactions });
            res.json({ messageId, reactions });
          });
        });
      }
    });
  });
});

// Delete a message (sender only)
router.delete('/:messageId', auth, (req, res) => {
  const userId = req.user.id;
  const messageId = req.params.messageId;

  db.get('SELECT sender_id, receiver_id FROM messages WHERE id = ?', [messageId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Message not found' });
    if (row.sender_id !== userId) return res.status(403).json({ error: 'Not allowed' });

    const io = req.app.get('io');

    db.run('DELETE FROM messages WHERE id = ?', [messageId], (err2) => {
      if (err2) return res.status(500).json({ error: 'DB error' });

      // clean up reactions
      db.run('DELETE FROM message_reactions WHERE message_id = ?', [messageId], () => {
        // notify participants
        io.to(`user:${row.sender_id}`).emit('message:deleted', { messageId });
        io.to(`user:${row.receiver_id}`).emit('message:deleted', { messageId });
        res.json({ message: 'Deleted' });
      });
    });
  });
});

module.exports = router;
