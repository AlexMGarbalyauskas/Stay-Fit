// WorkoutReminderContext.js - React context to manage
//  workout reminders and notifications in the Stay Fit app.
// Provides countdown timers for scheduled 
// workouts, displays prompts when it's time to work out,
// and listens for real-time workout invite 
// notifications via WebSocket.
// Handles user interactions to dismiss or 
// close workout prompts, and ensures reminders are shown 
// at the right times.


// Context to manage workout reminders and notifications
// This context handles:
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../api';
import { SOCKET_BASE, getSocketOptions } from '../utils/socket';
import { log, error as logError } from '../utils/logger';





// - Countdown timers for today's scheduled workout
const WorkoutReminderContext = createContext();

// Custom hook to access workout reminder context
export const useWorkoutReminder = () => useContext(WorkoutReminderContext);

// - Displaying prompts when it's time to work out
const pad = (n) => String(n).padStart(2, '0');
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;





// - Listening for real-time workout invite 
// notifications via WebSocket
export function WorkoutReminderProvider({ children }) {

  // State to manage countdown, prompt visibility, 
  // today's workout details, and dismissed prompts
  const [countdown, setCountdown] = useState('');
  const [showWorkoutPrompt, setShowWorkoutPrompt] = useState(false);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [promptDismissed, setPromptDismissed] = useState({});
  const [refreshSeq, setRefreshSeq] = useState(0); // forces immediate re-check when plans change
  const reminderFiredRef = useRef(false); // tracks if today's reminder already fired



  //used effect 1 - Countdown timer for today's workout
  // Countdown timer for today's workout
  useEffect(() => {
    const runCheck = () => {
      const today = new Date();
      const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
      
      try {
        const stored = localStorage.getItem('workout-plans');
        if (stored) {
          const plans = JSON.parse(stored);
          const todayPlan = plans[todayKey];
          
          // If there's a workout scheduled for 
          // today and the prompt hasn't been dismissed, 
          // manage the countdown and prompt display
          if (todayPlan && todayPlan.time && !promptDismissed[todayKey]) {
            const now = new Date();
            const [hours, minutes] = todayPlan.time.split(':');
            const reminderDate = new Date();
            reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const diff = reminderDate - now;
            




            // If the reminder time is in the future, 
            // show countdown. If it's now or past, 
            // show prompt (if not already shown).
            if (diff > 0) {
              // Timer is counting down
              const h = Math.floor(diff / (1000 * 60 * 60));
              const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const s = Math.floor((diff % (1000 * 60)) / 1000);
              setCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
              setTodayWorkout({ ...todayPlan, date: todayPlan.date || todayKey });
            } else if (!reminderFiredRef.current) {
              // Timer has hit 0, show the prompt
              log('Workout reminder triggered!', { todayPlan, diff });
              reminderFiredRef.current = true;
              setCountdown('NOW!');
              setTodayWorkout({ ...todayPlan, date: todayPlan.date || todayKey });
              setShowWorkoutPrompt(true);

              // Note: We keep showing the prompt 
              // until dismissed, even if time has passed,
            } else {

              // Reminder already fired, keep showing prompt until dismissed
              setCountdown('NOW!');
              setTodayWorkout({ ...todayPlan, date: todayPlan.date || todayKey });
              // Ensure prompt stays visible
              setShowWorkoutPrompt(true);
            }

            // If the user dismisses the prompt, 
            // we won't show it again until the next day
          } else {
            if (promptDismissed[todayKey]) {
              setCountdown('');
              setTodayWorkout(null);
            }
          }
        }
      } catch (e) {
        logError('Failed to load workout plans', e);
      }
    };


    // Initial check and then every 
    // second to update countdown and show prompt 
    // at the right time
    runCheck();
    const interval = setInterval(runCheck, 1000);
    
    return () => clearInterval(interval);
  }, [promptDismissed, showWorkoutPrompt, refreshSeq]);
// End of useEffect 1





//use effect 2
  // Listen for explicit plan change events (e.g., calendar save/cancel) to refresh immediately
  useEffect(() => {
    const handler = (event) => {
      const dateKeyChanged = event?.detail?.date;
      if (dateKeyChanged) {
        setPromptDismissed((prev) => {
          const next = { ...prev };
          delete next[dateKeyChanged];
          return next;
        });
      }
      setRefreshSeq((seq) => seq + 1);
    };
    window.addEventListener('workout-plans-changed', handler);
    return () => window.removeEventListener('workout-plans-changed', handler);
  }, []);
// End of useEffect 2




//use effect 3
  // Listen for incoming workout invites via socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const socket = io(SOCKET_BASE, getSocketOptions(token));
      
      socket.on('connect', () => {
        log('🏋️ Socket connected for workout reminders');
      });

      socket.on('notification:new', (data) => {
        try {
          if (data?.type === 'workout_invite') {
            log('Received workout invite notification:', data);
            const inviteData = data.data ? (typeof data.data === 'string' ? JSON.parse(data.data) : data.data) : {};
            
            setTodayWorkout({
              workout: inviteData.workout || 'Workout',
              isInvite: true,
              ...inviteData
            });
            setShowWorkoutPrompt(true);
          }
        } catch (err) {
          logError('Error processing workout invite notification:', err);
        }
      });

      socket.on('error', (error) => {
        logError('Socket error:', error);
      });

      socket.on('disconnect', () => {
        log('Socket disconnected');
      });

      return () => {
        try {
          socket.disconnect();
        } catch (err) {
          logError('Error disconnecting socket:', err);
        }
      };
    } catch (err) {
      logError('Failed to initialize workout reminder socket:', err);
      return undefined;
    }
  }, []);
// End of useEffect 3






  // User interaction handlers for workout prompt
  const dismissPrompt = () => {
    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    setPromptDismissed(prev => ({ ...prev, [todayKey]: true }));
    setShowWorkoutPrompt(false);
    setTodayWorkout(null);
    reminderFiredRef.current = false; // Reset for next time
  };





  // If the user just wants to close the 
  // prompt without dismissing,
  const closePrompt = () => {
    setShowWorkoutPrompt(false);
  };





  // The prompt will reappear at the next 
  // scheduled time or if the user receives a new invite,
  return (
    <WorkoutReminderContext.Provider 
      value={{ 
        countdown, 
        showWorkoutPrompt, 
        todayWorkout,
        closePrompt,
        dismissPrompt
      }}
    >
      {children}
    </WorkoutReminderContext.Provider>
  );
}
