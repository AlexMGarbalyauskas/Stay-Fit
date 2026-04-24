//const 
const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const router = express.Router();
//const end


//PURPOSE: This file defines routes related to user profiles, friends, and posts. It includes:
//userRoutes.js - handles user-related routes (profile, friends, posts)







//block 1 
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
//block 1 end










//block 2
// GET user's friends list (specific routes BEFORE generic /:id)
router.get('/:id/friends', auth, (req, res) => {

  // This query gets all friends of the user, 
  // whether they are the user_id or friend_id in the friends table
  db.all(
    `SELECT u.id, u.username, u.profile_picture, u.nickname 
     FROM users u 
     WHERE u.id IN (
       SELECT friend_id FROM friends WHERE user_id = ?
       UNION
       SELECT user_id FROM friends WHERE friend_id = ?
     )`,
    [req.params.id, req.params.id],

    // Callback to handle the result of the query
    (err, rows) => {
      if (err) {
        console.error('Error fetching friends:', err);
        return res.status(500).json({ error: 'DB error' });
      }
      res.json({ friends: rows || [] });
    }
  );
});
//block 2 end








//block 3
// GET user's posts (only if public or user is friends with them)
router.get('/:id/posts', auth, (req, res) => {

  // First, get the user's privacy setting
  // This determines whether we can show their posts to the requesting user
  db.get(
    'SELECT privacy FROM users WHERE id = ?',
    [req.params.id],
    (err, user) => {
      if (err) {
        console.error('Error fetching user privacy:', err);
        return res.status(500).json({ error: 'DB error' });
      }

      // If user doesn't exist, return 404
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Check if requesting user is the owner
      if (req.user.id === parseInt(req.params.id)) {
        // Owner can see all their own posts

        // Fetch posts for the user, ordered by creation date (newest first)
        db.all(
          'SELECT id, title, caption, media_path, media_type, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC',
          [req.params.id],
          (err, posts) => {

            // Handle any errors that occur during the database query
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

        // This query checks if there is a friendship between the requesting user and the target user
        db.get(
          `SELECT 1 FROM friends 
           WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
          [req.user.id, req.params.id, req.params.id, req.user.id],
          (err, friendship) => {

            // Handle any errors that occur during the database query
            if (err) {
              console.error('Error checking friendship:', err);
              return res.status(500).json({ error: 'DB error' });
            }
            
            // If not friends, return empty posts
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
//block 3 end










//block 4
// GET single user by ID (generic route AFTER specific ones)
// This route retrieves a user's profile information based on their ID. 
// It is protected by authentication middleware, ensuring that only logged-in users can access it. 
// The route queries the database for the user's details and returns them in the response. 
// If the user is not found, it returns a 404 error.
router.get('/:id', auth, (req, res) => {

  // This query selects the user's id, username, bio, profile picture, nickname, privacy setting, 
  // and location from the users table where the id matches the provided parameter.
  db.get(
    'SELECT id, username, bio, profile_picture, nickname, privacy, location FROM users WHERE id = ?',
    [req.params.id],

    // Callback function to handle the result of the database query
    (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!row) return res.status(404).json({ error: 'User not found' });
      res.json({ user: row });
    }
  );
});
//block 4 end






module.exports = router;
