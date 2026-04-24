//const
const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const router = express.Router();
//const end




//block 1
// Get notifications (optional ?type=)
// If type is provided, filter by type. Always return in descending order of created_at
router.get('/', auth, (req, res) => {


  // Validate type if provided
  const type = req.query.type;
  const params = [req.user.id];
  let sql = 'SELECT id, type, data, read, created_at FROM notifications WHERE user_id = ?';

  // If type is provided, add to query
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  sql += ' ORDER BY created_at DESC';

  // Execute query
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });

    // parse JSON data
    const parsed = rows.map(r => ({ ...r, data: r.data ? JSON.parse(r.data) : null }));

    // Enrich usernames if we have user ids in data
    const tasks = parsed.map(r => new Promise((resolve) => {
      const data = r.data || {};
      const idToFetch = data.fromUserId || data.byUserId;
      if (!idToFetch) return resolve(r);

      // Fetch username for the given user id
      db.get('SELECT username FROM users WHERE id = ?', [idToFetch], (err2, user) => {
        if (!err2 && user) {
          if (data.fromUserId) r.data.fromUsername = user.username;
          if (data.byUserId) r.data.fromUsername = user.username;
        }
        resolve(r);
      });
    }));

    // Wait for all enrichment tasks to finish
    Promise.all(tasks).then(results => res.json({ notifications: results }));
  });
});
//block 1 end












//block 2
// Create a notification
router.post('/create', auth, (req, res) => {

  // Validate input
  const { type, data } = req.body;
  if (!type) return res.status(400).json({ error: 'Missing notification type' });
  
  // Store data as stringified JSON if it's an object, or directly if it's already a string
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data || {});
  const createdAt = new Date().toISOString();
  
  // Insert into DB
  db.run('INSERT INTO notifications (user_id, type, data, created_at) VALUES (?, ?, ?, ?)', 
    [req.user.id, type, dataStr, createdAt], 

    // Callback to handle result
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create notification' });
      res.json({ id: this.lastID, type, data: JSON.parse(dataStr), created_at: createdAt, read: 0 });
    }
  );
});
//block 2 end











//block 3
// Mark one notification read
// We expect { id } in body, which is the notification id to mark as read
router.post('/mark-read', auth, (req, res) => {

  // Validate input
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Update the notification to mark as read, but only if it belongs to the user
  db.run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ updated: this.changes });
  });
});
//block 3 end









//block 4
// Mark all read
router.post('/mark-all-read', auth, (req, res) => {

  // Update all notifications for the user to mark as read
  db.run('UPDATE notifications SET read = 1 WHERE user_id = ?', [req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ updated: this.changes });
  });
});
//block 4 end








//block 5
// Delete a notification
router.delete('/:id', auth, (req, res) => {

  // Get notification id from URL params
  const notificationId = req.params.id;

  // Delete the notification, but only if it belongs to the user
  db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Notification not found or not yours' });
    res.json({ deleted: true });
  });
});
//block 5 end





module.exports = router;
