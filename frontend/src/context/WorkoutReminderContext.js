import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../api';
import { SOCKET_BASE, getSocketOptions } from '../utils/socket';

const WorkoutReminderContext = createContext();

export const useWorkoutReminder = () => useContext(WorkoutReminderContext);

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function WorkoutReminderProvider({ children }) {
  const [countdown, setCountdown] = useState('');
  const [showWorkoutPrompt, setShowWorkoutPrompt] = useState(false);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [promptDismissed, setPromptDismissed] = useState({});
  const [refreshSeq, setRefreshSeq] = useState(0); // forces immediate re-check when plans change
  const reminderFiredRef = useRef(false); // tracks if today's reminder already fired

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
          
          if (todayPlan && todayPlan.time && !promptDismissed[todayKey]) {
            const now = new Date();
            const [hours, minutes] = todayPlan.time.split(':');
            const reminderDate = new Date();
            reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const diff = reminderDate - now;
            
            if (diff > 0) {
              // Timer is counting down
              const h = Math.floor(diff / (1000 * 60 * 60));
              const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const s = Math.floor((diff % (1000 * 60)) / 1000);
              setCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
              setTodayWorkout({ ...todayPlan, date: todayPlan.date || todayKey });
            } else if (!reminderFiredRef.current) {
              // Timer has hit 0, show the prompt
              console.log('🏋️ Workout reminder triggered!', { todayPlan, diff });
              reminderFiredRef.current = true;
              setCountdown('NOW!');
              setTodayWorkout({ ...todayPlan, date: todayPlan.date || todayKey });
              setShowWorkoutPrompt(true);
            } else {
              // Reminder already fired, keep showing prompt until dismissed
              setCountdown('NOW!');
              setTodayWorkout({ ...todayPlan, date: todayPlan.date || todayKey });
              // Ensure prompt stays visible
              setShowWorkoutPrompt(true);
            }
          } else {
            if (promptDismissed[todayKey]) {
              setCountdown('');
              setTodayWorkout(null);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load workout plans', e);
      }
    };

    runCheck();
    const interval = setInterval(runCheck, 1000);
    
    return () => clearInterval(interval);
  }, [promptDismissed, showWorkoutPrompt, refreshSeq]);

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

  // Listen for incoming workout invites via socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const socket = io(SOCKET_BASE, getSocketOptions(token));
      
      socket.on('connect', () => {
        console.log('🏋️ Socket connected for workout reminders');
      });

      socket.on('notification:new', (data) => {
        try {
          if (data?.type === 'workout_invite') {
            console.log('🏋️ Received workout invite notification:', data);
            const inviteData = data.data ? (typeof data.data === 'string' ? JSON.parse(data.data) : data.data) : {};
            
            setTodayWorkout({
              workout: inviteData.workout || 'Workout',
              isInvite: true,
              ...inviteData
            });
            setShowWorkoutPrompt(true);
          }
        } catch (err) {
          console.error('Error processing workout invite notification:', err);
        }
      });

      socket.on('error', (error) => {
        console.error('🏋️ Socket error:', error);
      });

      socket.on('disconnect', () => {
        console.log('🏋️ Socket disconnected');
      });

      return () => {
        try {
          socket.disconnect();
        } catch (err) {
          console.error('Error disconnecting socket:', err);
        }
      };
    } catch (err) {
      console.error('Failed to initialize workout reminder socket:', err);
      return undefined;
    }
  }, []);

  const dismissPrompt = () => {
    const today = new Date();
    const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    setPromptDismissed(prev => ({ ...prev, [todayKey]: true }));
    setShowWorkoutPrompt(false);
    setTodayWorkout(null);
    reminderFiredRef.current = false; // Reset for next time
  };

  const closePrompt = () => {
    setShowWorkoutPrompt(false);
  };

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
