const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

// Cancel a workout schedule (creator only)
router.delete('/:scheduleId', auth, (req, res) => {
  const { scheduleId } = req.params;
  const { reason } = req.query;
  const io = req.app.get('io');

  // Ensure the requester is the creator
  db.get('SELECT * FROM workout_schedules WHERE id = ? AND creator_id = ?', [scheduleId, req.user.id], (err, schedule) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found or not authorized' });

    // Get participants before deleting
    db.all('SELECT user_id FROM workout_schedule_participants WHERE schedule_id = ?', [scheduleId], (err2, participants) => {
      if (err2) return res.status(500).json({ error: 'DB error fetching participants' });

      // Delete participants and schedule
      db.run('DELETE FROM workout_schedule_participants WHERE schedule_id = ?', [scheduleId], (err3) => {
        if (err3) return res.status(500).json({ error: 'DB error deleting participants' });

        db.run('DELETE FROM workout_schedules WHERE id = ?', [scheduleId], (err4) => {
          if (err4) return res.status(500).json({ error: 'DB error deleting schedule' });

          // Notify all participants about cancellation
          // Fetch creator username for nicer messaging
          db.get('SELECT username FROM users WHERE id = ?', [req.user.id], (err5, creatorRow) => {
            const creatorUsername = creatorRow?.username || 'Your friend';
            const notifType = reason === 'optout' ? 'workout_opt_out' : 'workout_canceled';
            const notifData = {
              scheduleId: Number(scheduleId),
              workout: schedule.workout_type,
              date: schedule.date,
              time: schedule.reminder_time,
              creatorId: req.user.id,
              creatorUsername,
            };

            participants.forEach(p => {
              db.run('INSERT INTO notifications (user_id, type, data, read) VALUES (?, ?, ?, ?)', [p.user_id, notifType, JSON.stringify(notifData), 0], (err6) => {
                if (err6) console.error('Error creating cancellation notification:', err6);
              });
              if (io) {
                io.to(`user:${p.user_id}`).emit('notification:new', { type: notifType, data: notifData });
              }
            });

            return res.json({ success: true, message: 'Workout canceled and buddies notified.' });
          });
        });
      });
    });
  });
});

// Create workout schedule and invite buddies
router.post('/', auth, (req, res) => {
  const { date, workout, time, buddies } = req.body;
  
  if (!date || !workout || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = 'INSERT INTO workout_schedules (creator_id, date, workout_type, reminder_time) VALUES (?, ?, ?, ?)';
  
  db.run(sql, [req.user.id, date, workout, time], function(err) {
    if (err) {
      console.error('Error creating workout schedule:', err);
      return res.status(500).json({ error: 'Failed to create workout schedule' });
    }

    const scheduleId = this.lastID;

    // Add participants
    if (buddies && buddies.length > 0) {
      const participantsSql = 'INSERT INTO workout_schedule_participants (schedule_id, user_id, status) VALUES (?, ?, ?)';
      const getCreatorSql = 'SELECT username FROM users WHERE id = ?';
      
      // Get io instance from app
      const io = req.app.get('io');
      
      // Get creator username
      db.get(getCreatorSql, [req.user.id], (err, creator) => {
        const creatorUsername = creator ? creator.username : 'Unknown';
        
        buddies.forEach(buddyId => {
          db.run(participantsSql, [scheduleId, buddyId, 'pending'], function(err) {
            if (err) console.error('Error adding participant:', err);
            
            const participantId = this.lastID;
            
            // Create notification for buddy with detailed data
            const notifSql = 'INSERT INTO notifications (user_id, type, data, read) VALUES (?, ?, ?, ?)';
            const notifData = {
              scheduleId,
              participantId,
              creatorId: req.user.id,
              creatorUsername,
              workout,
              date,
              time
            };
            
            db.run(notifSql, [buddyId, 'workout_invite', JSON.stringify(notifData), 0], (err, notifId) => {
              if (err) {
                console.error('Error creating notification:', err);
              } else {
                // Emit socket event to buddy
                if (io) {
                  io.to(`user:${buddyId}`).emit('notification:new', {
                    type: 'workout_invite',
                    data: notifData
                  });
                  console.log(`📨 Sent workout invite notification to user ${buddyId}`);
                }
              }
            });
          });
        });
      });
    }

    res.json({ 
      success: true, 
      scheduleId,
      message: 'Workout schedule created and invites sent!' 
    });
  });
});

// Get my workout schedules
router.get('/my-schedules', auth, (req, res) => {
  const sql = `
    SELECT ws.*, 
           COUNT(wsp.id) as participant_count
    FROM workout_schedules ws
    LEFT JOIN workout_schedule_participants wsp ON ws.id = wsp.schedule_id
    WHERE ws.creator_id = ?
    GROUP BY ws.id
    ORDER BY ws.date DESC
  `;
  
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ schedules: rows || [] });
  });
});

// Get workout invites (schedules I'm invited to)
router.get('/invites', auth, (req, res) => {
  const sql = `
    SELECT ws.*, 
           wsp.status,
           wsp.id as participant_id,
           u.username as creator_username
    FROM workout_schedule_participants wsp
    JOIN workout_schedules ws ON wsp.schedule_id = ws.id
    JOIN users u ON ws.creator_id = u.id
    WHERE wsp.user_id = ?
    ORDER BY ws.date DESC
  `;
  
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ invites: rows || [] });
  });
});

// Respond to workout invite
router.post('/invites/:participantId/respond', auth, (req, res) => {
  const { participantId } = req.params;
  const { status } = req.body; // 'accepted' or 'declined'

  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const sql = 'UPDATE workout_schedule_participants SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
  
  db.run(sql, [status, participantId, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Invite not found' });

    // Notify creator
    db.get('SELECT schedule_id FROM workout_schedule_participants WHERE id = ?', [participantId], (err, row) => {
      if (!err && row) {
        db.get('SELECT creator_id FROM workout_schedules WHERE id = ?', [row.schedule_id], (err, schedule) => {
          if (!err && schedule) {
            const message = status === 'accepted' 
              ? 'accepted your workout invite' 
              : 'declined your workout invite';
            db.run(
              'INSERT INTO notifications (user_id, type, sender_id, message) VALUES (?, ?, ?, ?)',
              [schedule.creator_id, 'workout_response', req.user.id, message]
            );
          }
        });
      }
    });

    res.json({ success: true, status });
  });
});

module.exports = router;
