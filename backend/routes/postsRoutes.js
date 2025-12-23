const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration'); // npm install get-video-duration
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'media');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB
  fileFilter: (req, file, cb) => {
    if (!(file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/'))) return cb(new Error('Only video or image files allowed'));
    cb(null, true);
  },
});

// Create a post with image or video
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No media uploaded' });

    const { caption, title } = req.body;
    const filePath = path.join(uploadDir, req.file.filename);

    const mediaType = req.file.mimetype;
    let duration = null;

    if (mediaType.startsWith('video/')) {
      // Check duration (server-side): must be between 5 and 60 seconds
      try {
        duration = await getVideoDurationInSeconds(filePath);
      } catch (err) {
        try { fs.unlinkSync(filePath); } catch (e) {}
        return res.status(400).json({ error: 'Failed to read video duration. Try a different encoding or ensure file is a valid video.' });
      }

      if (duration < 5 || duration > 60) {
        try { fs.unlinkSync(filePath); } catch (e) {}
        return res.status(400).json({ error: 'Video must be between 5 and 60 seconds' });
      }
    }

    const mediaPath = `/uploads/media/${req.file.filename}`;
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO posts (user_id, title, caption, media_path, media_type, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title || null, caption || null, mediaPath, mediaType, duration ? Math.round(duration) : null, createdAt],
      function (err) {
        if (err) {
          console.error('Failed to insert post', err);
          return res.status(500).json({ error: 'Failed to create post' });
        }

        const post = {
          id: this.lastID,
          user_id: req.user.id,
          title: title || null,
          caption: caption || null,
          media_path: mediaPath,
          media_type: mediaType,
          duration_seconds: duration ? Math.round(duration) : null,
          created_at: createdAt,
        };

        // Notify friends that a new post was created (only friends)
        try {
          const io = req.app.get('io');
          // Bidirectional friends list
          db.all(
            'SELECT friend_id AS id FROM friends WHERE user_id = ? UNION SELECT user_id AS id FROM friends WHERE friend_id = ?',
            [req.user.id, req.user.id],
            (errFriends, friendRows) => {
              if (!errFriends && friendRows && friendRows.length) {
                friendRows.forEach((fr) => {
                  const fid = fr.id;
                  // Insert notification row
                  db.run(
                    'INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)',
                    [fid, 'post', JSON.stringify({ postId: post.id, fromUserId: req.user.id, title: post.title || null })],
                    (errNotif) => {
                      if (errNotif) {
                        console.error('Failed to create post notification', errNotif);
                      }
                    }
                  );
                  // Emit socket toast + feed refresh
                  try {
                    if (io) {
                      io.to(`user:${fid}`).emit('notification:new', { type: 'post', postId: post.id, fromUserId: req.user.id, title: post.title || null });
                      io.to(`user:${fid}`).emit('post:new', { postId: post.id, fromUserId: req.user.id });
                    }
                  } catch (e) {}
                });
              }
              // respond after scheduling notifications
              return res.json({ post });
            }
          );
        } catch (e) {
          // Fallback: even if notifications fail, return the post
          return res.json({ post });
        }
      }
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Edit a post (title + caption)
router.put('/:id', auth, (req, res) => {
  const postId = Number(req.params.id);
  const { title, caption } = req.body;

  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    db.run('UPDATE posts SET title = ?, caption = ? WHERE id = ?', [title || null, caption || null, postId], function (err2) {
      if (err2) return res.status(500).json({ error: 'Failed to update post' });
      db.get('SELECT p.*, u.username, u.profile_picture FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [postId], (err3, updated) => {
        if (err3) return res.status(500).json({ error: 'Failed to fetch updated post' });
        res.json({ post: updated });
      });
    });
  });
});

// Get recent posts (feed) — only friends and yourself
router.get('/', auth, (req, res) => {
  // Get friend ids for current user (bidirectional: both user_id and friend_id)
  db.all(
    'SELECT friend_id FROM friends WHERE user_id = ? UNION SELECT user_id FROM friends WHERE friend_id = ?',
    [req.user.id, req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      const friendIds = rows.map(r => r.friend_id || r.user_id);

      // include self
      const ids = [...friendIds, req.user.id];
      if (ids.length === 0) return res.json({ posts: [] });

      const placeholders = ids.map(() => '?').join(',');
      // include counts and whether current user liked/saved
      const sql = `SELECT p.*, u.username, u.profile_picture,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
        (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
        (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
        FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id IN (${placeholders}) ORDER BY p.created_at DESC LIMIT 100`;
      // IMPORTANT: param order must match the SQL placeholders sequence
      const params = [req.user.id, req.user.id, ...ids];
      db.all(sql, params, (err2, posts) => {
        if (err2) return res.status(500).json({ error: 'Failed to fetch posts' });
        // normalize liked/saved to booleans
        posts = posts.map(p => ({ ...p, liked: !!p.liked, saved: !!p.saved }));
        res.json({ posts });
      });
    }
  );
});

// Get posts for a user id — only viewable by their friends or themselves
router.get('/user/:id', auth, (req, res) => {
  const userId = Number(req.params.id);
  const requester = req.user.id;

  const buildAndSend = (paramsForLikedSaved) => {
    const sql = `SELECT p.*, u.username, u.profile_picture,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
      (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
      (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
      (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
      FROM posts p JOIN users u ON p.user_id = u.id WHERE user_id = ? ORDER BY p.created_at DESC`;

    db.all(sql, paramsForLikedSaved, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch user posts' });
      rows = rows.map(r => ({ ...r, liked: !!r.liked, saved: !!r.saved }));
      res.json({ posts: rows });
    });
  };

  if (userId === requester) {
    return buildAndSend([requester, requester, userId]);
  }

  // Check friendship
  db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [userId, requester], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(403).json({ error: 'Not authorized to view posts' });

    buildAndSend([requester, requester, userId]);
  });
});

// Get posts for current user
router.get('/me', auth, (req, res) => {
  const requester = req.user.id;
  const sql = `SELECT p.*, u.username, u.profile_picture,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
    (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
    (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
    (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
    FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.created_at DESC`;

  db.all(sql, [requester, requester, requester], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch your posts' });
    rows = rows.map(r => ({ ...r, liked: !!r.liked, saved: !!r.saved }));
    res.json({ posts: rows });
  });
});

// Get posts saved by current user
router.get('/saved', auth, (req, res) => {
  const requester = req.user.id;
  const sql = `SELECT p.*, u.username, u.profile_picture,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
    (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
    (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
    (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
    FROM posts p
    JOIN users u ON p.user_id = u.id
    JOIN saves sv ON sv.post_id = p.id
    WHERE sv.user_id = ?
    ORDER BY sv.created_at DESC`;

  db.all(sql, [requester, requester, requester], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch saved posts' });
    rows = rows.map(r => ({ ...r, liked: !!r.liked, saved: !!r.saved }));
    res.json({ posts: rows });
  });
});

// Comments: get comments for a post
router.get('/:id/comments', auth, (req, res) => {
  const postId = Number(req.params.id);
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check permission: only owner or friends can view (reuse friendship model)
    const requester = req.user.id;
    const owner = post.user_id;
    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view comments' });

        db.all('SELECT c.*, u.username, u.profile_picture FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC', [postId], (err3, rows) => {
          if (err3) return res.status(500).json({ error: 'Failed to fetch comments' });
          res.json({ comments: rows });
        });
      });
    } else {
      db.all('SELECT c.*, u.username, u.profile_picture FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC', [postId], (err3, rows) => {
        if (err3) return res.status(500).json({ error: 'Failed to fetch comments' });
        res.json({ comments: rows });
      });
    }
  });
});

// Create a comment on a post
router.post('/:id/comments', auth, (req, res) => {
  const postId = Number(req.params.id);
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content required' });

  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    // Only friend or owner can comment
    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to comment' });

        insertComment();
      });
    } else insertComment();

    function insertComment() {
      const createdAt = new Date().toISOString();
      db.run('INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)', [postId, requester, content.trim(), createdAt], function (err3) {
        if (err3) return res.status(500).json({ error: 'Failed to create comment' });

        const commentId = this.lastID;
        db.get('SELECT c.*, u.username, u.profile_picture FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [commentId], (err4, row) => {
          if (err4) return res.status(500).json({ error: 'Failed to fetch created comment' });

          // create a notification for post owner (if not commenting on own post)
          if (requester !== owner) {
            db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [owner, 'comment', JSON.stringify({ fromUserId: requester, postId, commentId, content: content.slice(0,200) })], (err5) => {
              if (err5) console.error('Failed to create comment notification', err5);
              try {
                const io = req.app.get('io');
                io && io.to(`user:${owner}`).emit('notification:new', { type: 'comment', fromUserId: requester, postId, commentId, content: content.slice(0,200) });
              } catch (e) {}
            });
          }

          // return created comment and updated comments_count
          db.get('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [postId], (err5, cntRow) => {
            if (err5) return res.status(500).json({ error: 'Failed to fetch comments count' });
            const commentsCount = cntRow.count;
            // emit an event for real-time updates
            try { const io = req.app.get('io'); io && io.emit('post:commentsUpdated', { postId, commentsCount }); } catch (e) {}

            res.json({ comment: row, comments_count: commentsCount });
          });
        });
      });
    }
  });
});


// Get a single post (with counts and user flags)
router.get('/:id', auth, (req, res) => {
  const postId = Number(req.params.id);
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    function proceed() {
      const sql = `SELECT p.*, u.username, u.profile_picture,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
        (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
        (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
        FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`;

      db.get(sql, [requester, requester, postId], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'Failed to fetch post' });
        row = { ...row, liked: !!row.liked, saved: !!row.saved };
        res.json({ post: row });
      });
    }

    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view post' });
        proceed();
      });
    } else proceed();
  });
});


// Likes: get count and whether current user liked
router.get('/:id/likes', auth, (req, res) => {
  const postId = Number(req.params.id);
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    function proceed() {
      db.get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, requester], (err3, r3) => {
          if (err3) return res.status(500).json({ error: 'DB error' });
          res.json({ count: row.count, liked: !!r3 });
        });
      });
    }

    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view likes' });
        proceed();
      });
    } else proceed();
  });
});

// Toggle like
router.post('/:id/like', auth, (req, res) => {
  const postId = Number(req.params.id);
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    function proceed() {
      db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (row) {
          // unlike
          db.run('DELETE FROM likes WHERE id = ?', [row.id], function (err3) {
            if (err3) return res.status(500).json({ error: 'Failed to remove like' });
            db.get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId], (err4, cnt) => {
              if (err4) return res.status(500).json({ error: 'DB error' });
              res.json({ liked: false, count: cnt.count });
            });
          });
        } else {
          // like
          db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, requester], function (err3) {
            if (err3) return res.status(500).json({ error: 'Failed to create like' });

            // create notification for post owner (if not liking own post)
            if (requester !== owner) {
              db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [owner, 'like', JSON.stringify({ fromUserId: requester, postId })], (err4) => {
                if (err4) console.error('Failed to create like notification', err4);
                try { const io = req.app.get('io'); io && io.to(`user:${owner}`).emit('notification:new', { type: 'like', fromUserId: requester, postId }); } catch (e) {}
              });
            }

            db.get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId], (err4, cnt) => {
              if (err4) return res.status(500).json({ error: 'DB error' });
              res.json({ liked: true, count: cnt.count });
            });
          });
        }
      });
    }

    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to like' });
        proceed();
      });
    } else proceed();
  });
});

// Saves: get count and whether current user saved
router.get('/:id/saves', auth, (req, res) => {
  const postId = Number(req.params.id);
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    function proceed() {
      db.get('SELECT COUNT(*) as count FROM saves WHERE post_id = ?', [postId], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        db.get('SELECT * FROM saves WHERE post_id = ? AND user_id = ?', [postId, requester], (err3, r3) => {
          if (err3) return res.status(500).json({ error: 'DB error' });
          res.json({ count: row.count, saved: !!r3 });
        });
      });
    }

    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view saves' });
        proceed();
      });
    } else proceed();
  });
});

// Toggle save
router.post('/:id/save', auth, (req, res) => {
  const postId = Number(req.params.id);
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    function proceed() {
      db.get('SELECT * FROM saves WHERE post_id = ? AND user_id = ?', [postId, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (row) {
          // unsave
          db.run('DELETE FROM saves WHERE id = ?', [row.id], function (err3) {
            if (err3) return res.status(500).json({ error: 'Failed to remove save' });
            db.get('SELECT COUNT(*) as count FROM saves WHERE post_id = ?', [postId], (err4, cnt) => {
              if (err4) return res.status(500).json({ error: 'DB error' });
              res.json({ saved: false, count: cnt.count });
            });
          });
        } else {
          // save
          db.run('INSERT INTO saves (post_id, user_id) VALUES (?, ?)', [postId, requester], function (err3) {
            if (err3) return res.status(500).json({ error: 'Failed to create save' });
            db.get('SELECT COUNT(*) as count FROM saves WHERE post_id = ?', [postId], (err4, cnt) => {
              if (err4) return res.status(500).json({ error: 'DB error' });
              res.json({ saved: true, count: cnt.count });
            });
          });
        }
      });
    }

    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to save' });
        proceed();
      });
    } else proceed();
  });
});

module.exports = router;