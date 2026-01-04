const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// GET all users (exclude self)
router.get('/', auth, (req, res) => {
  db.all(
    'SELECT id, username, profile_picture, nickname FROM users WHERE id != ?',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ users: rows });
    }
  );
});

// GET user's friends list (specific routes BEFORE generic /:id)
router.get('/:id/friends', auth, (req, res) => {
  db.all(
    `SELECT u.id, u.username, u.profile_picture, u.nickname 
     FROM users u 
     WHERE u.id IN (
       SELECT friend_id FROM friends WHERE user_id = ?
       UNION
       SELECT user_id FROM friends WHERE friend_id = ?
     )`,
    [req.params.id, req.params.id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching friends:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      res.json({ friends: rows || [] });
    }
  );
});

// GET user's posts (only if public or user is friends with them)
router.get('/:id/posts', auth, (req, res) => {
  // First, get the user's privacy setting
  db.get(
    'SELECT privacy FROM users WHERE id = ?',
    [req.params.id],
    (err, user) => {
      if (err) {
        console.error('Error fetching user privacy:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Check if requesting user is the owner
      if (req.user.id === parseInt(req.params.id)) {
        // Owner can see all their own posts
        db.all(
          'SELECT id, title, caption, media_path, media_type, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC',
          [req.params.id],
          (err, posts) => {
            if (err) {
              console.error('Error fetching own posts:', err);
              return res.status(500).json({ error: 'DB error' });
            }
            res.json({ posts: posts || [] });
          }
        );
        return;
      }

      // If private, don't show posts
      if (user.privacy === 'Private') {
        return res.json({ posts: [] });
      }

      // If friends only, check if users are friends
      if (user.privacy === 'Friends Only') {
        db.get(
          `SELECT 1 FROM friends 
           WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
          [req.user.id, req.params.id, req.params.id, req.user.id],
          (err, friendship) => {
            if (err) {
              console.error('Error checking friendship:', err);
              return res.status(500).json({ error: 'DB error' });
            }
            
            if (!friendship) {
              return res.json({ posts: [] });
            }

            // Friends can see posts
            db.all(
              'SELECT id, title, caption, media_path, media_type, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC',
              [req.params.id],
              (err, posts) => {
                if (err) {
                  console.error('Error fetching friend posts:', err);
                  return res.status(500).json({ error: 'DB error' });
                }
                res.json({ posts: posts || [] });
              }
            );
          }
        );
        return;
      }

      // Public - show all posts
      db.all(
        'SELECT id, title, caption, media_path, media_type, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC',
        [req.params.id],
        (err, posts) => {
          if (err) {
            console.error('Error fetching public posts:', err);
            return res.status(500).json({ error: 'DB error' });
          }
          res.json({ posts: posts || [] });
        }
      );
    }
  );
});

// GET single user by ID (generic route AFTER specific ones)
router.get('/:id', auth, (req, res) => {
  db.get(
    'SELECT id, username, bio, profile_picture, nickname, privacy, location FROM users WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});

module.exports = router;
