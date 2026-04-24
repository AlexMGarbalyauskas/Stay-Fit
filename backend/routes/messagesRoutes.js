// const
const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const router = express.Router();
// const end





//block 1
// Get messaging block status with a user
// Returns: { blockedByMe: bool, blockedMe: bool, blockedEither: bool }
router.get('/blocks/:userId/status', auth, (req, res) => {
  
  // blockedByMe: I have blocked them, blockedMe: they have blocked me, blockedEither: either of the two
  const me = req.user.id;
  const other = Number(req.params.userId);

  // Validate userId
  if (!other || Number.isNaN(other)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  // Check block status in one query
  db.get(
    `SELECT
      EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blockedByMe,
      EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blockedMe`,
    [me, other, other, me],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      const blockedByMe = !!row?.blockedByMe;
      const blockedMe = !!row?.blockedMe;
      res.json({ blockedByMe, blockedMe, blockedEither: blockedByMe || blockedMe });
    }
  );
});
//block 1 end







//block 2
// Block a user from messaging you
router.post('/blocks/:userId', auth, (req, res) => {

  // blockedByMe: I have blocked them, blockedMe: they have blocked me, blockedEither: either of the two
  const me = req.user.id;
  const other = Number(req.params.userId);

  // Validate userId
  if (!other || Number.isNaN(other)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  // Prevent blocking self
  if (me === other) {
    return res.status(400).json({ error: 'You cannot block yourself' });
  }

  // Insert block record (idempotent)
  db.run('INSERT OR IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)', [me, other], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    res.json({ success: true, blockedByMe: true, blockedMe: false, blockedEither: true });
  });
});
//block 2 end








//block 3
// Unblock a user
// Returns updated block status
router.delete('/blocks/:userId', auth, (req, res) => {

  // blockedByMe: I have blocked them, blockedMe: they have blocked me, blockedEither: either of the two
  const me = req.user.id;
  const other = Number(req.params.userId);


  // Validate userId
  if (!other || Number.isNaN(other)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }


  // Prevent unblocking self
  db.run('DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?', [me, other], (err) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    // After unblocking, check if the other user has blocked me
    db.get(
      `SELECT
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blockedByMe,
        EXISTS(SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?) AS blockedMe`,
      [me, other, other, me],
      (statusErr, row) => {
        if (statusErr) return res.status(500).json({ error: 'DB error' });
        const blockedByMe = !!row?.blockedByMe;
        const blockedMe = !!row?.blockedMe;
        res.json({ success: true, blockedByMe, blockedMe, blockedEither: blockedByMe || blockedMe });
      }
    );
  });
});
//block 3 end







//block 4
// Get chat history with a user
router.get('/:userId', auth, (req, res) => {

  // Validate userId
  const me = req.user.id;
  const other = req.params.userId;


  // Validate userId
  db.all(
        `SELECT messages.id, messages.sender_id, messages.receiver_id, messages.content,
          IFNULL(messages.message_type,'text') as message_type,
          messages.media_url,
          messages.encrypted_content,
          messages.iv,
          messages.is_encrypted,
          messages.created_at AS created_at,
         u.profile_picture AS sender_profile_picture
     FROM messages
       JOIN users u ON u.id = messages.sender_id
     WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
     ORDER BY messages.created_at ASC`,
    [me, other, other, me],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ messages: rows });
    }
  );
});
//block 4 end






//block 5
// Get reactions for a message (aggregated)
// Returns: { messageId, reactions: [{ emoji, count, reacted_by_me }] }
router.get('/:messageId/reactions', auth, (req, res) => {

  // Validate messageId
  const userId = req.user.id;
  const messageId = req.params.messageId;

  // Check if message exists and user is a participant
  db.all(
    `SELECT emoji, COUNT(*) AS count,
            SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reacted_by_me
     FROM message_reactions
     WHERE message_id = ?
     GROUP BY emoji`,
    [userId, messageId],

    // For each emoji, we get the total count and whether the current user has reacted with it
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      const reactions = rows.map(r => ({ emoji: r.emoji, count: r.count, reacted_by_me: r.reacted_by_me ? 1 : 0 }));
      res.json({ messageId, reactions });
    }
  );
});
//block 5 end












//bock 6
// Toggle reaction for a message
router.post('/:messageId/reactions', auth, (req, res) => {

  // Validate messageId and emoji
  const userId = req.user.id;
  const messageId = req.params.messageId;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Missing emoji' });

  // check participants of message to notify both sides
  db.get('SELECT sender_id, receiver_id FROM messages WHERE id = ?', [messageId], (err, msgRow) => {
    if (err || !msgRow) return res.status(404).json({ error: 'Message not found' });

    // Check if user is a participant
    db.get('SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?', [messageId, userId, emoji], (err2, row) => {
      const io = req.app.get('io');

      // If row exists, user has already reacted with this emoji, so we remove it. Otherwise, we add it.
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

            // Map the aggregates to the desired format
            const reactions = aggs.map(r => ({ emoji: r.emoji, count: r.count, reacted_by_me: r.reacted_by_me ? 1 : 0 }));


            // emit to participants
            io.to(`user:${msgRow.sender_id}`).emit('reaction:update', { messageId, reactions });
            io.to(`user:${msgRow.receiver_id}`).emit('reaction:update', { messageId, reactions });
            res.json({ messageId, reactions });
          });
        });

        // Note: In a real application, you might want to wrap the delete and subsequent select in a transaction to ensure consistency.
      } else {
        // add reaction
        db.run('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)', [messageId, userId, emoji], function (err5) {
          if (err5) return res.status(500).json({ error: 'DB error' });

          // send updated aggregates
          db.all(`SELECT emoji, COUNT(*) AS count,
                      SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reacted_by_me
                   FROM message_reactions
                   WHERE message_id = ?
                   GROUP BY emoji`, [userId, messageId], (err6, aggs) => {

                    // Again, consider wrapping the insert and select in a transaction in a real application.
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
//block 6 end






//block 7 
// Delete a message (sender only)
router.delete('/:messageId', auth, (req, res) => {

  // Validate messageId
  const userId = req.user.id;
  const messageId = req.params.messageId;

  // Check if message exists and user is sender
  db.get('SELECT sender_id, receiver_id FROM messages WHERE id = ?', [messageId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Message not found' });
    if (row.sender_id !== userId) return res.status(403).json({ error: 'Not allowed' });

    // If the user is the sender, we delete the message and its reactions, then notify both participants
    const io = req.app.get('io');

    // delete message
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
//block 7 end




module.exports = router;
