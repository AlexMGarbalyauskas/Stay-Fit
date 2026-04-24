//const
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration'); // npm install get-video-duration
const auth = require('../middleware/auth');
const db = require('../db');
const router = express.Router();
//cosnt end



//PURPOSE: 
//postRoutes.js - all routes related to posts, including creating/editing/deleting posts, 
// liking/saving, and comments on posts. All routes require authentication.






//block 1
// Export my posts
router.get('/mine/export', auth, (req, res) => {

  // For simplicity, we export as JSON
  db.all('SELECT id, title, caption, media_path, media_type, duration_seconds, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ posts: rows });
  });
});
//block 1 end







//block 2 
// Delete a comment
// This route deletes a comment and all its replies (cascading delete). Only the comment owner can delete their comment.
router.delete('/:postId/comments/:commentId', auth, (req, res) => {

  // Validate IDs
  const commentId = Number(req.params.commentId);
  const postId = Number(req.params.postId);
  const requester = req.user.id;

  // First, verify the comment exists and belongs to the requester
  db.get('SELECT * FROM comments WHERE id = ? AND post_id = ?', [commentId, postId], (err, comment) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.user_id !== requester) return res.status(403).json({ error: 'Not authorized to delete this comment' });

    // Get all reply IDs for cascading delete
    db.all('SELECT id FROM comments WHERE parent_comment_id = ?', [commentId], (err_replies, replies) => {
      if (err_replies) return res.status(500).json({ error: 'DB error' });
      
      // Delete all reply likes
      const replyIds = replies ? replies.map(r => r.id) : [];
      if (replyIds.length > 0) {
        replyIds.forEach(rId => {
          db.run('DELETE FROM comment_likes WHERE comment_id = ?', [rId], () => {});
        });
      }
      
      // Delete all replies
      db.run('DELETE FROM comments WHERE parent_comment_id = ?', [commentId], (err_del_replies) => {
        if (err_del_replies) console.error('Error deleting replies:', err_del_replies);
        
        // Delete the parent comment
        db.run('DELETE FROM comments WHERE id = ?', [commentId], (err2) => {
          if (err2) return res.status(500).json({ error: 'Failed to delete comment' });
          
          // Clean up likes on this comment
          db.run('DELETE FROM comment_likes WHERE comment_id = ?', [commentId], () => {
            // Update comment count (only count parent comments)
            db.get('SELECT COUNT(*) as count FROM comments WHERE post_id = ? AND parent_comment_id IS NULL', [postId], (err3, cntRow) => {
              if (err3) return res.status(500).json({ error: 'DB error' });
              res.json({ message: 'Deleted', comments_count: cntRow.count });
            });
          });
        });
      });
    });
  });
});
//block 2 end







//block 3 
// Like/Unlike a comment
// This route toggles a like on a comment. If the user has already liked the comment, 
// it will unlike it, and vice versa. It also returns the updated 
// like count and whether the comment is currently liked by the user.
router.post('/:postId/comments/:commentId/like', auth, (req, res) => {

  // Validate IDs
  const commentId = Number(req.params.commentId);
  const postId = Number(req.params.postId);
  const requester = req.user.id;

  // First, verify the comment exists and belongs to the post
  db.get('SELECT * FROM comments WHERE id = ? AND post_id = ?', [commentId, postId], (err, comment) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Check if already liked
    db.get('SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, requester], (err2, likeRow) => {
      if (err2) return res.status(500).json({ error: 'DB error' });

      // If likeRow exists, user has liked this comment, so we will unlike it. Otherwise, we will like it.
      if (likeRow) {
        // Unlike
        db.run('DELETE FROM comment_likes WHERE id = ?', [likeRow.id], (err3) => {
          if (err3) return res.status(500).json({ error: 'Failed to unlike' });
          db.get('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?', [commentId], (err4, cnt) => {
            if (err4) return res.status(500).json({ error: 'DB error' });
            res.json({ liked: false, likes_count: cnt.count });
          });
        });

        // Optionally, you could also create a notification for the comment owner when their comment is liked/unliked, but we'll skip that for simplicity.
      } else {
        // Like
        db.run('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, requester], (err3) => {
          if (err3) return res.status(500).json({ error: 'Failed to like' });
          db.get('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?', [commentId], (err4, cnt) => {
            if (err4) return res.status(500).json({ error: 'DB error' });
            res.json({ liked: true, likes_count: cnt.count });
          });
        });
      }
    });
  });
});
//block 3 end







// ===== END OF COMMENT-SPECIFIC ROUTES =====

// Set up multer for file uploads (images/videos)
const uploadDir = path.join(__dirname, '..', 'uploads', 'media');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });




//block 4 
// Multer storage configuration with unique filename generation
const storage = multer.diskStorage({

  // Store files in the uploads/media directory with a unique name
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});
//block 4 end




//block 5
const upload = multer({

  // Use the defined storage configuration, limit file size to 150 MB, and filter for video/image MIME types
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB
  fileFilter: (req, file, cb) => {

    // Only allow files that start with video/ or image/ MIME types
    console.log('Multer fileFilter - mimetype:', file.mimetype, 'originalname:', file.originalname);
    if (!(file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/'))) {
      console.log('Rejecting file - mimetype does not start with video/ or image/');
      return cb(new Error('Only video or image files allowed'));
    }

    // Accept the file
    cb(null, true);
  },
});
//block 5 end







//block 6
// Create a post with image or video
router.post('/', auth, upload.single('media'), async (req, res) => {

  // Validate that a file was uploaded
  try {
    if (!req.file) return res.status(400).json({ error: 'No media uploaded' });

    // Extract caption and title from the request body, and construct the file path
    const { caption, title } = req.body;
    const filePath = path.join(uploadDir, req.file.filename);
    
    // Log file details for debugging
    console.log('Processing upload:', {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      originalname: req.file.originalname
    });

    // Validate media type and, if it's a video, check its duration
    const mediaType = req.file.mimetype;
    let duration = null;


    // If the uploaded media is a video, we need to check its duration to ensure it meets our requirements (between 5 and 60 seconds)
    if (mediaType.startsWith('video/')) {
      // Check duration (server-side): must be between 5 and 60 seconds
      try {
        console.log('Reading video duration for:', filePath);
        duration = await getVideoDurationInSeconds(filePath);
        console.log('Video duration:', duration);
      } catch (err) {
        console.error('Failed to read video duration:', err.message);
        try { fs.unlinkSync(filePath); } catch (e) {}
        return res.status(400).json({ error: 'Failed to read video duration. Try a different encoding or ensure file is a valid video.' });
      }

      // If the duration is outside the allowed range, delete the uploaded file and return an error response
      if (duration < 5 || duration > 60) {
        console.log('Video duration out of range:', duration);
        try { fs.unlinkSync(filePath); } catch (e) {}
        return res.status(400).json({ error: 'Video must be between 5 and 60 seconds' });
      }
    }

    // Store post info in the database, including the path to the uploaded media, its type, and duration if it's a video
    const mediaPath = `/uploads/media/${req.file.filename}`;
    const createdAt = new Date().toISOString();


    // Insert the new post into the database with all relevant information. T
    // he media path is stored relative to the server root for easy access.
    db.run(
      'INSERT INTO posts (user_id, title, caption, media_path, media_type, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title || null, caption || null, mediaPath, mediaType, duration ? Math.round(duration) : null, createdAt],
      
      // After attempting to insert the post into the database, we check for errors.
      // If there is an error during insertion, we log it and return a 500 response. 
      // If the insertion is successful, we construct a post object to return in the response, 
      // which includes the new post ID generated by the database.
      function (err) {
        if (err) {
          console.error('Failed to insert post', err);
          return res.status(500).json({ error: 'Failed to create post' });
        }

        // Construct the post object to return in the response, including the new post ID generated by the database
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

    //catch error
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
//block 6 end








//block 7 
// Edit a post (title + caption)
router.put('/:id', auth, (req, res) => {

  // Validate post ID and extract title and caption from the request body
  const postId = Number(req.params.id);
  const { title, caption } = req.body;

  // First, verify the post exists and belongs to the requester
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    // Update the post's title and caption in the database. We allow either field to be null, but at least one must be provided.
    db.run('UPDATE posts SET title = ?, caption = ? WHERE id = ?', [title || null, caption || null, postId], function (err2) {
      if (err2) return res.status(500).json({ error: 'Failed to update post' });
      db.get('SELECT p.*, u.username, u.nickname, u.profile_picture FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [postId], (err3, updated) => {
        if (err3) return res.status(500).json({ error: 'Failed to fetch updated post' });
        res.json({ post: updated });
      });
    });
  });
});
//block 7 end







//block 8
// Delete a post (owner only)
router.delete('/:id', auth, (req, res) => {
  
  // Validate post ID
  const postId = Number(req.params.id);

  // First, verify the post exists and belongs to the requester
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    // Delete the post and all related data (likes, saves, comments). We also attempt to delete 
    // the media file from the filesystem, but we do this as a best-effort after responding 
    // to the client, so it doesn't block the response.
    const mediaFullPath = path.join(__dirname, '..', post.media_path.replace(/^\//, ''));

    // We use serialize to ensure these deletions happen in order, 
    // but we don't wait for the file deletion before responding.
    db.serialize(() => {
      db.run('DELETE FROM likes WHERE post_id = ?', [postId]);
      db.run('DELETE FROM saves WHERE post_id = ?', [postId]);
      db.run('DELETE FROM comments WHERE post_id = ?', [postId]);
      db.run('DELETE FROM posts WHERE id = ?', [postId], function (err2) {
        if (err2) return res.status(500).json({ error: 'Failed to delete post' });

        // best-effort file delete; do not block response
        fs.unlink(mediaFullPath, () => {});
        return res.json({ success: true });
      });
    });
  });
});
//block 8 end








//block 9
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
      const sql = `SELECT p.*, u.username, u.nickname, u.profile_picture,
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
//block 9 end








//block 10
// Get posts for a user id — only viewable by their friends or themselves
router.get('/user/:id', auth, (req, res) => {

  // Validate user ID
  const userId = Number(req.params.id);
  const requester = req.user.id;

  // This function builds and sends the posts for the specified user, including counts and liked/saved flags.
  const buildAndSend = (paramsForLikedSaved) => {
    const sql = `SELECT p.*, u.username, u.nickname, u.profile_picture,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
      (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
      (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
      (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
      FROM posts p JOIN users u ON p.user_id = u.id WHERE user_id = ? ORDER BY p.created_at DESC`;

      // The paramsForLikedSaved array should contain the requester ID twice 
      // (for liked and saved subqueries) followed by the userId for the main query. 
      // This ensures the correct order of parameters for the SQL query.
    db.all(sql, paramsForLikedSaved, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch user posts' });
      rows = rows.map(r => ({ ...r, liked: !!r.liked, saved: !!r.saved }));
      res.json({ posts: rows });
    });
  };

  // If the requester is the same as the userId, 
  // we can skip the friendship check and directly build and send the posts.
  if (userId === requester) {
    return buildAndSend([requester, requester, userId]);
  }

  // Check friendship
  // We check if the requester is a friend of the user whose posts they are trying to view.
  db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [userId, requester], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(403).json({ error: 'Not authorized to view posts' });

    buildAndSend([requester, requester, userId]);
  });
});
//block 10 end








//block 11 
// Get posts for current user
router.get('/me', auth, (req, res) => {

  // This route fetches the posts created by the currently authenticated user.
  const requester = req.user.id;
  const sql = `SELECT p.*, u.username, u.nickname, u.profile_picture,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
    (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
    (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
    (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
    FROM posts p JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.created_at DESC`;

    // The parameters for the SQL query include the requester ID twice 
    // (for liked and saved subqueries) followed by the requester ID again 
    // for the main query, since we are fetching the requester's own posts.
  db.all(sql, [requester, requester, requester], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch your posts' });
    rows = rows.map(r => ({ ...r, liked: !!r.liked, saved: !!r.saved }));
    res.json({ posts: rows });
  });
});
//block 11 end







//block 12
// Get posts saved by current user
router.get('/saved', auth, (req, res) => {

  // This route fetches the posts that the currently authenticated user has saved.
  const requester = req.user.id;
  const sql = `SELECT p.*, u.username, u.nickname, u.profile_picture,
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

    // The parameters for the SQL query include the requester ID twice
  db.all(sql, [requester, requester, requester], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch saved posts' });
    rows = rows.map(r => ({ ...r, liked: !!r.liked, saved: !!r.saved }));
    res.json({ posts: rows });
  });
});
//block 12 end




//block 13 
// Comments: get comments for a post
router.get('/:id/comments', auth, (req, res) => {

  // Validate post ID and extract requester ID
  const postId = Number(req.params.id);
  const requester = req.user.id;

  // First, verify the post exists
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check permission: only owner or friends can view (reuse friendship model)
    const owner = post.user_id;
    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view comments' });

        fetchComments();
      });
    } else {
      fetchComments();
    }

    // This function fetches all comments for the post, 
    // including user info, like counts, and whether the current user liked each comment.
    function fetchComments() {
      // Fetch all comments (both parent and child)
      db.all(
        `SELECT c.*, u.username, u.nickname, u.profile_picture,
                (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes_count,
                (SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as liked_by_me,
                (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id) as replies_count
         FROM comments c JOIN users u ON c.user_id = u.id 
         WHERE c.post_id = ? 
         ORDER BY c.parent_comment_id, c.created_at ASC`,
        [requester, postId],
        (err3, rows) => {
          if (err3) return res.status(500).json({ error: 'Failed to fetch comments' });
          
          // Structure comments into parent/child relationships
          const comments = [];
          const commentsMap = {};
          
          rows.forEach(row => {
            commentsMap[row.id] = { ...row, replies: [] };
          });
          
          // First pass to create a map of comments by ID
          rows.forEach(row => {
            if (row.parent_comment_id === null) {
              comments.push(commentsMap[row.id]);
            } else if (commentsMap[row.parent_comment_id]) {
              commentsMap[row.parent_comment_id].replies.push(commentsMap[row.id]);
            }
          });
          
          res.json({ comments });
        }
      );
    }
  });
});
//block 13 end








//block 14
// Create a comment on a post
router.post('/:id/comments', auth, (req, res) => {

  // Validate post ID and extract comment content and optional parent comment ID from the request body
  const postId = Number(req.params.id);
  const { content, parent_comment_id } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content required' });

  // First, verify the post exists
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check permission: only owner or friends can comment (reuse friendship model)
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

    
    // This function inserts the new comment into the database, creates a notification 
    // for the post owner if necessary, and returns the created 
    // comment along with the updated comments count for the post.
    function insertComment() {

      // Insert the new comment into the database with the provided content,
      const createdAt = new Date().toISOString();
      const parentCommentId = parent_comment_id ? Number(parent_comment_id) : null;
      db.run('INSERT INTO comments (post_id, user_id, content, parent_comment_id, created_at) VALUES (?, ?, ?, ?, ?)', [postId, requester, content.trim(), parentCommentId, createdAt], function (err3) {
        if (err3) return res.status(500).json({ error: 'Failed to create comment' });

        // Fetch the created comment with user info to return in the response
        const commentId = this.lastID;
        db.get('SELECT c.*, u.username, u.nickname, u.profile_picture FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [commentId], (err4, row) => {
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
          db.get('SELECT COUNT(*) as count FROM comments WHERE post_id = ? AND parent_comment_id IS NULL', [postId], (err5, cntRow) => {
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
//block 14 end







//block 15
// Get a single post (with counts and user flags)
router.get('/:id', auth, (req, res) => {

  // Validate post ID and extract requester ID
  const postId = Number(req.params.id);
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check permission: only owner or friends can view (reuse friendship model)
    const requester = req.user.id;
    const owner = post.user_id;


    // This function builds and sends the post data, including counts and liked/saved flags.
    function proceed() {
      const sql = `SELECT p.*, u.username, u.nickname, u.profile_picture,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM saves s WHERE s.post_id = p.id) as saves_count,
        (SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked,
        (SELECT 1 FROM saves s2 WHERE s2.post_id = p.id AND s2.user_id = ?) as saved
        FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`;


      // The parameters for the SQL query include the requester ID twice 
      // (for liked and saved subqueries) followed by the postId for the main query.
      db.get(sql, [requester, requester, postId], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'Failed to fetch post' });
        row = { ...row, liked: !!row.liked, saved: !!row.saved };
        res.json({ post: row });
      });
    }

    // Only friend or owner can view
    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view post' });
        proceed();
      });
    } else proceed();
  });
});
//block 15 end










//block 16
// Likes: get count and whether current user liked
router.get('/:id/likes', auth, (req, res) => {

  // Validate post ID and extract requester ID
  const postId = Number(req.params.id);

  // First, verify the post exists
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    // This function fetches the total count of likes for the post 
    // and checks if the current user has liked it, then returns this information in the response.
    function proceed() {
      db.get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [postId, requester], (err3, r3) => {
          if (err3) return res.status(500).json({ error: 'DB error' });
          res.json({ count: row.count, liked: !!r3 });
        });
      });
    }


    // Only friend or owner can view
    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view likes' });
        proceed();
      });
    } else proceed();
  });
});
//block 16 end








//block 17
// Toggle like
router.post('/:id/like', auth, (req, res) => {


  // Validate post ID and extract requester ID
  const postId = Number(req.params.id);

  // First, verify the post exists
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });


    // This function toggles the like status for the current user on the specified post.
    const requester = req.user.id;
    const owner = post.user_id;


    // If the user has already liked the post, it removes the like; otherwise, it adds a new like.
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

          // delete notification for post owner (if not unliking own post)
        } else {

          // like
          db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, requester], function (err3) {
            if (err3) return res.status(500).json({ error: 'Failed to create like' });

            // create notification for post owner (if not liking own post)
            if (requester !== owner) {

              // Insert notification row
              db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [owner, 'like', JSON.stringify({ fromUserId: requester, postId })], (err4) => {
                if (err4) console.error('Failed to create like notification', err4);
                try { const io = req.app.get('io'); io && io.to(`user:${owner}`).emit('notification:new', { type: 'like', fromUserId: requester, postId }); } catch (e) {}
              });
            }


            // return updated like count and status
            db.get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId], (err4, cnt) => {
              if (err4) return res.status(500).json({ error: 'DB error' });
              res.json({ liked: true, count: cnt.count });
            });
          });
        }
      });
    }


    // Only friend or owner can like
    if (owner !== requester) {

      // We check if the requester is a friend of the post owner before allowing them to like the post.
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {

        // If there is an error during the database query, we return a 500 response.
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to like' });
        proceed();
      });

      // If the requester is the owner of the post, we allow them to like/unlike without checking for friendship.
    } else proceed();
  });
});
//block 17 end








//block 18
// Saves: get count and whether current user saved
router.get('/:id/saves', auth, (req, res) => {

  // Validate post ID and extract requester ID
  const postId = Number(req.params.id);

  // First, verify the post exists
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requester = req.user.id;
    const owner = post.user_id;

    // This function fetches the total count of saves for the post and checks 
    // if the current user has saved it, then returns this information in the response.
    function proceed() {

      //db query to get count of saves for the post

      db.get('SELECT COUNT(*) as count FROM saves WHERE post_id = ?', [postId], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        db.get('SELECT * FROM saves WHERE post_id = ? AND user_id = ?', [postId, requester], (err3, r3) => {
          if (err3) return res.status(500).json({ error: 'DB error' });
          res.json({ count: row.count, saved: !!r3 });
        });
      });
    }

    // Only friend or owner can view
    if (owner !== requester) {
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to view saves' });
        proceed();
      });

      // If the requester is the owner of the post, 
      // we allow them to view saves without checking for friendship.
    } else proceed();
  });
});
//block 18 end





//block 19
// Toggle save
// This route allows the authenticated user to toggle the saved status of a post.
router.post('/:id/save', auth, (req, res) => {

  // Validate post ID and extract requester ID
  const postId = Number(req.params.id);

  // First, verify the post exists
  db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // This function toggles the saved status for the current user on the specified post.
    const requester = req.user.id;
    const owner = post.user_id;

    // If the user has already saved the post, it removes the save; otherwise, it adds a new save.
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

          // Note: We do not create notifications for saves,
          //  so there is no need to delete any notifications when unsaving.
        } else {
          
          // save
          db.run('INSERT INTO saves (post_id, user_id) VALUES (?, ?)', [postId, requester], function (err3) {
            if (err3) return res.status(500).json({ error: 'Failed to create save' });

            // return updated save count and status
            db.get('SELECT COUNT(*) as count FROM saves WHERE post_id = ?', [postId], (err4, cnt) => {
              if (err4) return res.status(500).json({ error: 'DB error' });
              res.json({ saved: true, count: cnt.count });
            });
          });
        }
      });
    }

    // Only friend or owner can save
    if (owner !== requester) {

      
      db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [owner, requester], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'DB error' });
        if (!row) return res.status(403).json({ error: 'Not authorized to save' });
        proceed();
      });

      // If the requester is the owner of the post, we allow them to save/unsave without checking for friendship.
    } else proceed();
  });
});
//block 19 end





module.exports = router;