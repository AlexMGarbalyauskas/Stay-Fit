const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Get notifications (optional ?type=)
router.get('/', auth, (req, res) => {
  const type = req.query.type;
  const params = [req.user.id];
  let sql = 'SELECT id, type, data, read, created_at FROM notifications WHERE user_id = ?';
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' ORDER BY created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    // parse JSON data
    const parsed = rows.map(r => ({ ...r, data: r.data ? JSON.parse(r.data) : null }));

    // Enrich usernames if we have user ids in data
    const tasks = parsed.map(r => new Promise((resolve) => {
      const data = r.data || {};
      const idToFetch = data.fromUserId || data.byUserId;
      if (!idToFetch) return resolve(r);
      db.get('SELECT username FROM users WHERE id = ?', [idToFetch], (err2, user) => {
        if (!err2 && user) {
          if (data.fromUserId) r.data.fromUsername = user.username;
          if (data.byUserId) r.data.fromUsername = user.username;
        }
        resolve(r);
      });
    }));

    Promise.all(tasks).then(results => res.json({ notifications: results }));
  });
});

// Mark one notification read
router.post('/mark-read', auth, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ updated: this.changes });
  });
});

// Mark all read
router.post('/mark-all-read', auth, (req, res) => {
  db.run('UPDATE notifications SET read = 1 WHERE user_id = ?', [req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ updated: this.changes });
  });
});

// Delete a notification
router.delete('/:id', auth, (req, res) => {
  const notificationId = req.params.id;
  db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Notification not found or not yours' });
    res.json({ deleted: true });
  });
});

module.exports = router;
