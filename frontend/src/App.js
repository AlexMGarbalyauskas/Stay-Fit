// Main application component that sets up routing, authentication state, 
// and global UI elements like the workout prompt and notification toast.


//Import necessary libraries and components
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SocialLogin from './pages/SocialLogin';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailToken from './pages/VerifyEmailToken';
import Profile from './pages/Profile';
import SavedPosts from './pages/SavedPosts';
import Settings from './pages/Settings';
import UserDetails from './pages/UserDetails';
import OtherSettings from './pages/OtherSettings';
import AboutSettings from './pages/AboutSettings';
import StatsSettings from './pages/StatsSettings';
import ShareApp from './pages/ShareApp';
import PublicShare from './pages/PublicShare';
import AuthRequired from './pages/AuthRequired';
import FindFriends from './pages/FindFriends';
import Post from './pages/Post';
import PostComments from './pages/PostComments';
import FriendRequests from './pages/FriendRequests';
import UserProfile from './pages/UserProfile';
import UserFriends from './pages/UserFriends';
import Notifications from './pages/Notifications';
import Friends from './pages/Friends';
import ChatPage from './pages/ChatPage';
import { clearEncryption } from './utils/crypto';
import CalendarPage from './pages/Calendar';
import Tutorials from './pages/Tutorials';
import OnboardingTutorial from './pages/OnboardingTutorial';
import AIHelper from './pages/AIHelper';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DebugOverlay from './components/DebugOverlay';
import { WorkoutReminderProvider, useWorkoutReminder } from './context/WorkoutReminderContext';
import { LanguageProvider } from './context/LanguageContext';
import { io } from 'socket.io-client';
import { API_BASE } from './api';
import { SOCKET_BASE, getSocketOptions } from './utils/socket';
import { playNotificationSound } from './utils/sounds';
import { Dumbbell, X as Close, BellRing } from 'lucide-react';
import { log, error as logError } from './utils/logger';







// Main application component that sets up routing, authentication state,
function App() {
  // Tracks updates that should refresh the friends list page.
  const [refreshFriends, setRefreshFriends] = useState(0);

  // Reads auth state from localStorage on first render.
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return !!localStorage.getItem('token') && !!JSON.parse(localStorage.getItem('user'));
    } catch {
      return false;
    }
  });

  // Controls the initial splash loader visibility.
  const [booting, setBooting] = useState(true);

  // Wrap protected pages so guests are redirected to AuthRequired.
  const requireAuth = (element) => isAuthenticated ? element : <AuthRequired />;

  // Forces dependent pages to re-fetch friendship-related data.
  const triggerFriendRefresh = () => setRefreshFriends(prev => prev + 1);

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Listen to storage changes (multi-tab logout/login)
  useEffect(() => {
    const handleStorage = () => {
      try {
        setIsAuthenticated(!!localStorage.getItem('token') && !!JSON.parse(localStorage.getItem('user')));
      } catch {
        setIsAuthenticated(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Clears auth state and encryption keys on logout.
  const handleLogout = () => {
    localStorage.clear();
    clearEncryption(); // Clear encryption keys
    setIsAuthenticated(false);
  };

  // Simulate boot delay to show splash screen on app load.
  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(timer);
  }, []);


  // Main render with routing and global providers
  return (
    <Router>
      <LanguageProvider>
        <WorkoutReminderProvider>

          {/* Startup splash shown briefly while app boots */}
          {booting && <SplashLoader />}

          {/* Public and protected application routes */}
          <Routes>
            <Route path="/" element={<Home onLogout={handleLogout} isAuthenticated={isAuthenticated} />} />
            <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
            <Route path="/register" element={!isAuthenticated ? <Register onRegister={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
            <Route path="/social-login" element={!isAuthenticated ? <SocialLogin onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-email-token" element={<VerifyEmailToken />} />
            <Route path="/download" element={<PublicShare />} />

            <Route path="/home" element={<Home onLogout={handleLogout} isAuthenticated={isAuthenticated} />} />
            <Route path="/profile" element={requireAuth(<Profile />)} />
            <Route path="/saved-posts" element={requireAuth(<SavedPosts />)} />
            <Route path="/post" element={requireAuth(<Post />)} />
            <Route path="/posts/:id/comments" element={requireAuth(<PostComments />)} />
            <Route path="/settings" element={requireAuth(<Settings />)} />
            <Route path="/settings/details" element={requireAuth(<UserDetails />)} />
            <Route path="/settings/other" element={requireAuth(<OtherSettings />)} />
            <Route path="/settings/about" element={requireAuth(<AboutSettings />)} />
            <Route path="/settings/stats" element={requireAuth(<StatsSettings />)} />
            <Route path="/share" element={requireAuth(<ShareApp />)} />
            <Route path="/chat" element={requireAuth(<ChatPage />)} />
            <Route path="/chat/:id" element={requireAuth(<ChatPage />)} />
            <Route path="/calendar" element={requireAuth(<CalendarPage />)} />
            <Route path="/tutorials" element={requireAuth(<Tutorials isAuthenticated={isAuthenticated} />)} />
            <Route path="/onboarding" element={requireAuth(<OnboardingTutorial />)} />
            <Route path="/ai-helper" element={requireAuth(<AIHelper />)} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route
              path="/find"
              element={requireAuth(<FindFriends onFriendUpdate={triggerFriendRefresh} />)}
            />
            <Route
              path="/friend-requests"
              element={requireAuth(<FriendRequests onFriendUpdate={triggerFriendRefresh} />)}
            />
            <Route
              path="/friends"
              element={requireAuth(<Friends refreshTrigger={refreshFriends} />)}
            />
            <Route path="/users/:id" element={requireAuth(<UserProfile />)} />
            <Route path="/user/:id" element={requireAuth(<UserProfile />)} />
            <Route path="/notifications" element={requireAuth(<Notifications />)} />
            <Route path="/user/:id/friends" element={requireAuth(<UserFriends />)} />
          </Routes>

          {/* Global workout prompt modal */}
          <GlobalWorkoutPrompt />

          {/* Global notification toast kept inside Router so navigation works */}
          <NotificationToast />

        </WorkoutReminderProvider>
      </LanguageProvider>
    </Router>
  );

  // Displays scheduled workout prompt / invite actions.
  function GlobalWorkoutPrompt() {
    const { showWorkoutPrompt, todayWorkout, closePrompt, dismissPrompt } = useWorkoutReminder();
    const navigate = useNavigate();
    const [theme] = useState(localStorage.getItem('theme') || 'light');
    const lastPromptSoundKeyRef = useRef(null);
    const isDark = theme === 'dark';


    // log the workout prompt state for debugging purposes
    log('GlobalWorkoutPrompt state:', { showWorkoutPrompt, todayWorkout });


    // Play notification sound when a new workout prompt or invite is shown,
    // but only if it's different from the last one (to avoid replaying sound on re-renders).
    useEffect(() => {
      if (!showWorkoutPrompt || !todayWorkout) return;

      // Create a unique key for the current workout prompt based on its properties
      const soundKey = `${todayWorkout.scheduleId || todayWorkout.date || todayWorkout.time || todayWorkout.workout || 'workout'}:${todayWorkout.isInvite ? 'invite' : 'workout'}`;
      if (lastPromptSoundKeyRef.current === soundKey) return;
      lastPromptSoundKeyRef.current = soundKey;
      playNotificationSound(todayWorkout.isInvite ? 'invite' : 'workout');
    }, [showWorkoutPrompt, todayWorkout]);

    if (!showWorkoutPrompt || !todayWorkout) return null;


    // Removes the local workout plan for today when user cancels/skips their own workout.
    const removeLocalPlan = () => {

      try {
        const stored = localStorage.getItem('workout-plans');
        if (!stored) return;
        const plans = JSON.parse(stored);
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const key = todayWorkout?.date || todayKey;
        delete plans[key];
        localStorage.setItem('workout-plans', JSON.stringify(plans));

        // Also remove the workout reminder from localStorage to prevent it from showing again
      } catch (e) {
        logError('Failed to clean local plan on cancel:', e);
      }
    };

    // Calls the server to cancel the workout schedule when user cancels/skips their own workout.
    const cancelWorkoutServer = async (reason) => {
      if (!todayWorkout?.scheduleId) return;

      // For invites, we only decline but do not delete the schedule, so no need to call cancel endpoint
      try {
        const res = await fetch(`${API_BASE.replace('/api', '')}/api/workout-schedules/${todayWorkout.scheduleId}${reason ? `?reason=${reason}` : ''}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok && res.status !== 404) {
          throw new Error(`Cancel failed: ${res.status}`);
        }

        // If the schedule was already deleted (404), we can ignore it since our local cleanup will handle it.
      } catch (e) {
        logError('Failed to cancel workout on server:', e);
      }
    };

    // Handler for when user clicks "Yes, Post!" to post their workout video.
    const handlePostWorkout = () => {
      dismissPrompt();
      navigate('/post');
    };


    // For invites, we need to call the decline endpoint instead of canceling the schedule.
    const declineInviteIfNeeded = async () => {
      if (!todayWorkout?.isInvite || !todayWorkout?.participantId) return;

      // Call the decline invite endpoint
      try {
        await fetch(`${API_BASE.replace('/api', '')}/api/workout-schedules/invites/${todayWorkout.participantId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: 'declined' })
        });

        // We do not dismiss the prompt here because the parent handler will handle it after this call.
      } catch (e) {
        logError('Failed to decline invite on Not Now:', e);
      }
    };


    // Handler for when user clicks "Not Now" to skip their workout or decline an invite.
    const handleSkipWorkout = async () => {
      if (todayWorkout?.isInvite) {
        // For invites, just decline but do not delete the schedule
        await declineInviteIfNeeded();
      } else {
        // Treat Not Now as cancel for own plans
        await cancelWorkoutServer('optout');
        removeLocalPlan();
      }
      
      // Create notification that user cancelled/skipped the workout
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await fetch(`${API_BASE}/api/notifications/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              type: 'workout_cancelled',
              data: {
                workoutName: todayWorkout.workout || 'Workout',
                cancelledAt: new Date().toISOString(),
                isInvite: todayWorkout.isInvite || false,
                message: todayWorkout.isInvite 
                  ? `You declined the workout invite from ${todayWorkout.creatorUsername}`
                  : `You skipped your scheduled ${todayWorkout.workout} workout`
              }
            })
          }).catch(e => logError('Failed to create cancellation notification:', e));
        }
      } catch (e) {
        logError('Failed to create cancellation notification:', e);
      }
      
      dismissPrompt();
    };

    // Handler for when user clicks "Yes, I'm In!" to accept a workout invite.
    const handleAcceptInvite = () => {
      // Call accept endpoint
      if (todayWorkout.participantId && todayWorkout.scheduleId) {
        fetch(`${API_BASE.replace('/api', '')}/api/workout-schedules/invites/${todayWorkout.participantId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: 'accepted' })
        }).then(() => {
          dismissPrompt();
          alert('Workout accepted! See you there! 💪');
        }).catch(err => {
          logError('Failed to accept workout invite:', err);
          alert('Failed to accept invite');
        });
      }
    };



    // Handler for when user clicks "Maybe Later" to decline a workout invite.
    const handleDeclineInvite = () => {

      // Call decline endpoint
      if (todayWorkout.participantId && todayWorkout.scheduleId) {
        fetch(`${API_BASE.replace('/api', '')}/api/workout-schedules/invites/${todayWorkout.participantId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: 'declined' })
        }).then(() => {
          dismissPrompt();
          alert('Invite declined');
        }).catch(err => {
          logError('Failed to decline workout invite:', err);
          alert('Failed to decline invite');
        });
      }
    };



    // Render the workout prompt modal with different 
    // content and actions based on whether it's a regular
    // workout reminder or an invite.
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
        <div className={`rounded-2xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            
            {todayWorkout.isInvite ? (
              <>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Workout Invite! 🎉</h2>
                <p className={`text-lg mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="font-bold text-blue-400">{todayWorkout.creatorUsername}</span> invited you to a <span className="font-bold text-blue-400">{todayWorkout.workout}</span> workout
                </p>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {todayWorkout.date && `📅 ${todayWorkout.date}`} {todayWorkout.time && `⏰ ${todayWorkout.time}`}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDeclineInvite}
                    className={`flex-1 px-6 py-3 border-2 rounded-xl font-semibold transition ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleAcceptInvite}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition shadow-lg"
                  >
                    Yes, I'm In! 💪
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Workout Time! 🏋️</h2>
                <p className={`text-lg mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>It's time for your <span className="font-bold text-blue-400">{todayWorkout.workout}</span> workout!</p>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ready to post your workout video?</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipWorkout}
                    className={`flex-1 px-6 py-3 border-2 rounded-xl font-semibold transition ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Not Now
                  </button>
                  <button
                    onClick={handlePostWorkout}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition shadow-lg"
                  >
                    Yes, Post! 📸
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }


  //
  // Shows real-time notification toast from socket events.
  function NotificationToast() {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);


    // Sets up socket connection on mount and listens for new notifications.
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return undefined;

      const socket = io(SOCKET_BASE, getSocketOptions(token));

      const handleNotification = (data) => {
        if (!data) return;
        playNotificationSound(data.type === 'message' ? 'message' : 'notification');
        
        // Extract payload from either nested data.data (DB format) or directly from data (socket format)
        let payload = data.data || {};
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = { content: payload };
          }
        }
        
        // For message notifications, ensure fromUserId is available (comes directly from socket event)
        if (data.type === 'message' && !payload.fromUserId && data.fromUserId) {
          payload = {
            fromUserId: data.fromUserId,
            messageId: data.messageId,
            content: data.content,
            ...payload
          };
        }
        
        setToast({ type: data.type || 'notification', payload });
      };

      socket.on('notification:new', handleNotification);

      return () => {
        try {
          socket.off('notification:new', handleNotification);
          socket.disconnect();
        } catch (err) {
          logError('Failed to disconnect notification socket:', err);
        }
      };
    }, []);

    useEffect(() => {
      if (!toast) return undefined;
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }, [toast]);

    // If there's no active toast, render nothing.
    if (!toast) return null;
    const { type, payload } = toast;


    // When the toast is clicked, navigate to the relevant page based on notification type.
    const onClick = () => {
      setToast(null);
      if (type === 'message' && payload?.fromUserId) {
        navigate(`/chat/${payload.fromUserId}`);
      } else {
        navigate('/notifications');
      }
    };

    // Render the notification toast with different content based on type, 
    // and include a preview for message notifications.
    return (
      <>
        <div onClick={onClick} className="fixed top-20 right-4 z-50 animate-slideDown cursor-pointer">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <BellRing className="w-5 h-5" />
            <div>
              <span className="font-semibold">New {type === 'message' ? 'message' : type}!</span>
              {type === 'message' && payload?.content && (
                <div className="text-sm text-green-50 mt-0.5 truncate" style={{ maxWidth: 220 }}>
                  {payload.content}
                </div>
              )}
            </div>
          </div>
        </div>
        <style>{`
          @keyframes slideDown {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { transform: translateY(0); opacity: 1; }
            90% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(20px); opacity: 0; }
          }
          .animate-slideDown {
            animation: slideDown 3s ease-out forwards;
          }
        `}</style>
      </>
    );
  }




  // App startup loader shown during boot delay.
  function SplashLoader() {

    // Read theme from localStorage to apply correct styles to the loader.
    const [theme] = useState(localStorage.getItem('theme') || 'light');
    const isDark = theme === 'dark';
    




    // Render a full-screen loader with a dumbbell icon and swirling dots,
    //  styled differently for dark mode.
    return (
      <div className={`loader-overlay ${isDark ? 'dark-mode' : ''}`}>
        <div className="loader-container">
          <div className="loader-icon">
            <Dumbbell className={`w-16 h-16 ${isDark ? 'text-gray-900' : 'text-white'}`} />
          </div>
          <div className="loader-swirl">
            <span className="dot dot-a" />
            <span className="dot dot-b" />
            <span className="dot dot-c" />
          </div>
        </div>
        <div className="loader-text">Loading Stay Fit…</div>
      </div>
    );
  }
}
//main end 







// Export the main App component as default
export default App;
