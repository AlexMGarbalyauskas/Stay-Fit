//const
const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getTimezoneFromLocation } = require('../utils/timezone');
const bcrypt = require('bcrypt');
const router = express.Router();

// Multer setup for profile pictures
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_pics');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });
//const end 







//block 1  
// GET current user
router.get('/', auth, (req, res) => {

  // Fetch user data
  db.get(
    'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone, notifications_enabled FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});
//block 1 end








//block 2
// GET user's posts
// UPDATE bio & location & nickname (PUT endpoint)
// Note: This PUT endpoint is more RESTful and should be used for updates, while the POST /update can be kept for backward compatibility if needed.
router.put('/', auth, (req, res) => {

  // Only allow updating specific fields
  const { bio, location, nickname, privacy, timezone, notifications_enabled } = req.body;
  const updates = [];
  const params = [];

  // Validate inputs
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }

  // If location is updated, also auto-update timezone based on location
  if (location !== undefined) {
    updates.push('location = ?');
    params.push(location);
    // Auto-set timezone based on location
    const autoTimezone = getTimezoneFromLocation(location);
    updates.push('timezone = ?');
    params.push(autoTimezone);
  }

  // Optional fields
  if (nickname !== undefined) {
    updates.push('nickname = ?');
    params.push(nickname);
  }

  // Privacy can be 'public', 'friends', or 'private'
  if (privacy !== undefined) {
    updates.push('privacy = ?');
    params.push(privacy);
  }

  // Timezone should be a valid IANA timezone string
  if (timezone !== undefined) {
    updates.push('timezone = ?');
    params.push(timezone);
  }

  // Notifications enabled should be a boolean
  if (notifications_enabled !== undefined) {
    updates.push('notifications_enabled = ?');
    params.push(notifications_enabled ? 1 : 0);
  }

  // If no valid fields provided, return error
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  // Add user ID to params for WHERE clause
  params.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

  // Execute update
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });

    // Fetch updated user data
    db.get(
      'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone, notifications_enabled FROM users WHERE id = ?',
      [req.user.id],
      (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Failed to fetch updated user' });
        res.json({ user: row });
      }
    );
  });
});
//block 2 end








//block 3
// CHANGE password
// Note: This is a separate endpoint to follow RESTful principles, as changing password is a distinct action from updating profile info.
router.put('/password', auth, async (req, res) => {

  // Validate input
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  // Validate new password strength (example: minimum 6 characters)
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  // Fetch current password hash from DB
  const userId = req.user.id;
  const userRow = await new Promise((resolve, reject) => {
    
    // Get password hash for current user
    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  }).catch(() => null);

  // If user not found, return error
  if (!userRow) return res.status(404).json({ error: 'User not found' });

  // Compare current password with hash
  const ok = await bcrypt.compare(currentPassword, userRow.password_hash).catch(() => false);
  if (!ok) return res.status(401).json({ error: 'Invalid current password' });

  // Hash new password and update in DB
  const hash = await bcrypt.hash(newPassword, 10);
  
  // Update password hash in database
  db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update password' });
    res.json({ message: 'Password updated' });
  });
});
//block 3 end









//block 4
// UPDATE bio & location (legacy POST endpoint for backward compatibility)
// Note: This endpoint can be kept for backward compatibility, but the PUT / endpoint should be used for new clients.
router.post('/update', auth, (req, res) => {

  // Only allow updating specific fields
  const { bio, location, nickname, privacy, timezone } = req.body;
  const updates = [];
  const params = [];


  // Validate inputs and build update query
  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }


  // If location is updated, also auto-update timezone based on location
  if (location !== undefined) {
    updates.push('location = ?');
    params.push(location);
    // Auto-set timezone based on location
    const autoTimezone = getTimezoneFromLocation(location);
    updates.push('timezone = ?');
    params.push(autoTimezone);
  }


  // Optional fields
  if (nickname !== undefined) {
    updates.push('nickname = ?');
    params.push(nickname);
  }


  // Privacy can be 'public', 'friends', or 'private'
  if (privacy !== undefined) {
    updates.push('privacy = ?');
    params.push(privacy);
  }


  // Timezone should be a valid IANA timezone string
  if (timezone !== undefined) {
    updates.push('timezone = ?');
    params.push(timezone);
  }


  // If no valid fields provided, return error
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });


  // Add user ID to params for WHERE clause
  params.push(req.user.id);
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;


  // Execute update
  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });

    // Fetch updated user data
    db.get(
      'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone FROM users WHERE id = ?',
      [req.user.id],
      (err, row) => {
        if (err || !row) return res.status(500).json({ error: 'Failed to fetch updated user' });
        res.json({ user: row });
      }
    );
  });
});
//block 4 end







//block 5
// UPLOAD profile picture
// Note: This endpoint uses multipart/form-data and expects a file field named 'file'. It saves the uploaded image and updates the user's profile_picture field in the database.
router.post('/profile-picture', auth, upload.single('file'), (req, res) => {
  
  // Validate that a file was uploaded  
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Save file path to database
  const imagePath = `/uploads/profile_pics/${req.file.filename}`;
  
  // Update user's profile_picture field in the database
  db.run(
    'UPDATE users SET profile_picture = ? WHERE id = ?',
    [imagePath, req.user.id],
    function (err) {

      // If there's an error saving the profile picture, delete the uploaded file to clean up
      if (err) return res.status(500).json({ error: 'Failed to save profile picture' });

      // Fetch updated user data
      db.get(
        'SELECT id, username, email, bio, location, profile_picture, nickname, privacy, timezone FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err || !row) return res.status(500).json({ error: 'Failed to fetch user' });
          res.json({ profile_picture: row.profile_picture, user: row });
        }
      );
    }
  );
});
//block 5 end 









//block 6 
// DELETE account
// Note: This endpoint requires the user to provide their current password for verification before deleting the account. It also performs a thorough cleanup of all user-related data to maintain database integrity.
router.delete('/delete', auth, async (req, res) => {


  // Validate input
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password is required' });


  // Get user ID from auth middleware
  const userId = req.user.id;


  // Verify password
  // Fetch current password hash from DB
  const userRow = await new Promise((resolve, reject) => {
    db.get('SELECT password_hash FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  }).catch(() => null);

  // If user not found, return error
  if (!userRow) return res.status(404).json({ error: 'User not found' });
  
  // Compare provided password with stored hash
  const ok = await bcrypt.compare(password, userRow.password_hash).catch(() => false);
  if (!ok) return res.status(401).json({ error: 'Invalid password' });

  // Helper to run statement
  const run = (sql, params = []) => new Promise((resolve) => db.run(sql, params, () => resolve()));
  
  // Helper to get all rows
  const all = (sql, params = []) => new Promise((resolve) => db.all(sql, params, (err, rows) => resolve(rows || [])));

  // Clean up user data
  const userPosts = await all('SELECT id FROM posts WHERE user_id = ?', [userId]);
  
  // Extract post IDs for later use
  const postIds = userPosts.map(p => p.id);

  // Delete comment likes on user's comments and posts
  await run('DELETE FROM comment_likes WHERE user_id = ?', [userId]);
  if (postIds.length) {

    // First, find all comments on the user's posts to delete their likes
    const placeholders = postIds.map(() => '?').join(',');
    const commentsOnPosts = await all(`SELECT id FROM comments WHERE post_id IN (${placeholders})`, postIds);
    const commentIds = commentsOnPosts.map(c => c.id);
    if (commentIds.length) {
      const ph = commentIds.map(() => '?').join(',');
      await run(`DELETE FROM comment_likes WHERE comment_id IN (${ph})`, commentIds);
      await run(`DELETE FROM comments WHERE id IN (${ph})`, commentIds);
    }
  }

  // Delete user's comments, likes, saves, and posts
  await run('DELETE FROM comments WHERE user_id = ?', [userId]);
  await run('DELETE FROM likes WHERE user_id = ?', [userId]);
  await run('DELETE FROM saves WHERE user_id = ?', [userId]);
  if (postIds.length) {
    const placeholders = postIds.map(() => '?').join(',');
    await run(`DELETE FROM likes WHERE post_id IN (${placeholders})`, postIds);
    await run(`DELETE FROM saves WHERE post_id IN (${placeholders})`, postIds);
    await run(`DELETE FROM comments WHERE post_id IN (${placeholders})`, postIds);
    await run(`DELETE FROM posts WHERE id IN (${placeholders})`, postIds);
  }

  // Delete friendships, friend requests, messages, notifications, and workout schedules
  await run('DELETE FROM friend_requests WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
  await run('DELETE FROM friends WHERE user_id = ? OR friend_id = ?', [userId, userId]);
  await run('DELETE FROM message_reactions WHERE user_id = ?', [userId]);
  await run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
  await run('DELETE FROM notifications WHERE user_id = ?', [userId]);
  await run('DELETE FROM workout_schedules WHERE user_id = ?', [userId]);

  // Finally delete user
  await run('DELETE FROM users WHERE id = ?', [userId]);

  res.json({ message: 'Account deleted' });
});
//block 6 end






// Export the router to be used in the main app
module.exports = router;
