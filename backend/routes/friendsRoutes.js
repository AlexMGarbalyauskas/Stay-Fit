// const
const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');
const router = express.Router();
//const end




//purpose: This file defines the API routes for managing friend requests 
// and friendships between users. It includes endpoints for sending friend requests, 
// accepting/rejecting requests, viewing friends list, checking friendship status, 
// and unfriending. The routes use authentication middleware to ensure that only 
// logged-in users can access these features. Additionally, it integrates 
// with the notification system to alert users of new friend requests 
// and changes in friendship status in real-time via sockets.



// ------------------------------
// FRIEND REQUESTS AND FRIEND MANAGEMENT
// ------------------------------




// block 1 >router.post
// Send request
// This route allows an authenticated user to send a friend request to 
// another user by providing the receiver's ID.
router.post('/request', auth, (req, res) => {

  // Extract the receiverId from the request body, which indicates
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: 'Missing receiverId' });

  // Check if the receiver exists in the database
  db.run(
    'INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)',
    [req.user.id, receiverId],

    // Handle potential errors during the insertion of the friend request into the database
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Request already sent' });
        return res.status(500).json({ error: 'DB error' });
      }

      // If the friend request is successfully created, we get the ID of the new request
      const requestId = this.lastID;

      // Create a notification for receiver
      db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [receiverId, 'friend_request', JSON.stringify({ fromUserId: req.user.id, requestId })], (err2) => {
        if (err2) console.error('Failed to create notification', err2);

        // Emit socket notification if io available
        try {
          const io = req.app.get('io');
          io && io.to(`user:${receiverId}`).emit('notification:new', { type: 'friend_request', fromUserId: req.user.id, requestId });
        } catch (e) { }

        res.json({ message: 'Request sent', id: requestId });
      });
    }
  );
});
// block 1 end










// block 2 >router.get
// Get incoming requests
// This route allows an authenticated user to retrieve a list of 
// incoming friend requests,
router.get('/requests', auth, (req, res) => {

  // Query the database to get all friend requests where the authenticated user is the receiver,
  db.all(
    `SELECT fr.id, fr.sender_id, u.username, u.nickname
     FROM friend_requests fr
     JOIN users u ON u.id = fr.sender_id
     WHERE fr.receiver_id = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ requests: rows });
    }
  );
});
// block 2 end












//block 3 router.post
// Accept request
// This route allows an authenticated user to accept a friend 
// request by providing the request ID and sender ID.
router.post('/accept', auth, (req, res) => {

  // Extract the requestId and senderId from the request body, which are necessary to identify the friend request being accepted
  const { requestId, senderId } = req.body;
  if (!requestId || !senderId) return res.status(400).json({ error: 'Missing data' });

  // Insert a new friendship into the friends table for both users,
  db.run(
    'INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)',
    [req.user.id, senderId, senderId, req.user.id],
    err => {
      if (err) return res.status(500).json({ error: 'DB error' });

      // After successfully creating the friendship, we delete the original friend request from the database
      db.run('DELETE FROM friend_requests WHERE id = ?', [requestId], () => {
        // remove related notification if any
        db.run("DELETE FROM notifications WHERE user_id = ? AND type = 'friend_request' AND data LIKE ?", [req.user.id, `%\"requestId\":${requestId}%`], () => {
          res.json({ message: 'Friend request accepted' });
        });
      });
    }
  );
});
// block 3 end












// block 4 >router.post
// Reject request
// This route allows an authenticated user to reject a friend request
router.post('/reject', auth, (req, res) => {

  // Extract the requestId from the request body, which is necessary to identify the friend request being rejected
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });

  // Delete the friend request from the database using the provided requestId,
  db.run('DELETE FROM friend_requests WHERE id = ?', [requestId], () => {
    // remove related notification(s)
    db.run("DELETE FROM notifications WHERE user_id = ? AND type = 'friend_request' AND data LIKE ?", [req.user.id, `%\"requestId\":${requestId}%`], () => {
      res.json({ message: 'Friend request rejected' });
    });
  });
});
// block 4 end










// block 5 >router.get
// Get friends list
// This route allows an authenticated user to 
// retrieve their list of friends.
router.get('/', auth, (req, res) => {

  // Query the database to get all friends of the authenticated user by joining the friends table with the users table to retrieve friend details
  db.all(
    `SELECT u.id, u.username, u.profile_picture, u.nickname
     FROM friends f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = ?`,
    [req.user.id],

    // Handle potential errors during the database query and return the list of friends in the response
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ friends: rows });
    }
  );
});
// block 5 end











// block 6 >router.get
// Friend status
// This route allows an authenticated user to 
// check the friendship status
router.get('/status/:id', auth, (req, res) => {

  // Extract the other user's ID from the route parameters to check the friendship status with that user
  const otherId = req.params.id;

  // Query the database to check if there is an existing friendship between the authenticated user and the other user, and if not, check if there is a pending friend request sent by the authenticated user to the other user
  db.get('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [req.user.id, otherId], (err, row) => {
    if (row) return res.json({ status: 'friends' });

    // If they are not friends, check if there is a pending friend request sent by the authenticated user to the other user
    db.get('SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?', [req.user.id, otherId], (err2, sent) => {
      if (sent) return res.json({ status: 'sent' });
      res.json({ status: 'none' });
    });
  });
});
// block 6 end









// block 7 >router.post
// Unfriend
// This route allows an authenticated user to unfriend another 
// user by providing the friend's ID.
router.post('/unfriend', auth, (req, res) => {

  // Extract the friendId from the request body, which is necessary to identify which friend to unfriend
  const { friendId } = req.body;
  if (!friendId) return res.status(400).json({ error: 'Missing friendId' });

  // Delete the friendship from the database for both users, ensuring that the friendship is removed regardless of the order of user_id and friend_id in the friends table
  db.run(
    'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
    [req.user.id, friendId, friendId, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      // After successfully unfriending, we also want to remove any existing friend requests between the two users to clean up the database
      // notify the other user that they have been unfriended
      db.run('INSERT INTO notifications (user_id, type, data) VALUES (?, ?, ?)', [friendId, 'unfriended', JSON.stringify({ byUserId: req.user.id })], (err2) => {
        if (err2) console.error('Failed to create unfriended notification', err2);
        
        // Emit socket notification if io available
        try {
          const io = req.app.get('io');
          io && io.to(`user:${friendId}`).emit('notification:new', { type: 'unfriended', byUserId: req.user.id });
        } catch (e) {}
        res.json({ message: 'Unfriended successfully' });
      });
    }
  );
});
// block 7 end








// Finally, we export the router so it can be 
// used in the main server file to handle 
// requests to /api/friends
module.exports = router;
