const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

/* ===============================
   GET CHAT HISTORY
================================ */
router.get('/:userId', auth, (req, res) => {
  const me = req.user.id;
  const other = req.params.userId;

  db.all(
    `
    SELECT *
    FROM messages
    WHERE 
      (sender_id = ? AND receiver_id = ?)
      OR
      (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
    `,
    [me, other, other, me],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ messages: rows });
    }
  );
});

module.exports = router;
