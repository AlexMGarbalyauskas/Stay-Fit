import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SocialLogin from './pages/SocialLogin';
import Profile from './pages/Profile';
import SavedPosts from './pages/SavedPosts';
import Settings from './pages/Settings';
import OtherSettings from './pages/OtherSettings';
import AboutSettings from './pages/AboutSettings';
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
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DebugOverlay from './components/DebugOverlay';
import { WorkoutReminderProvider, useWorkoutReminder } from './context/WorkoutReminderContext';
import { LanguageProvider } from './context/LanguageContext';
import { io } from 'socket.io-client';
import { API_BASE } from './api';
import { SOCKET_BASE, getSocketOptions } from './utils/socket';
import { Dumbbell, X as Close } from 'lucide-react';

function App() {
  const [refreshFriends, setRefreshFriends] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return !!localStorage.getItem('token') && !!JSON.parse(localStorage.getItem('user'));
    } catch {
      return false;
    }
  });
  const [booting, setBooting] = useState(true);

  const requireAuth = (element) => isAuthenticated ? element : <AuthRequired />;

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

  const handleLogout = () => {
    localStorage.clear();
    clearEncryption(); // Clear encryption keys
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <LanguageProvider>
        <WorkoutReminderProvider>
          {booting && <SplashLoader />}
          <Routes>
          <Route path="/" element={<Home onLogout={handleLogout} isAuthenticated={isAuthenticated} />} />
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
        <Route path="/register" element={!isAuthenticated ? <Register onRegister={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
        <Route path="/social-login" element={!isAuthenticated ? <SocialLogin onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
        <Route path="/download" element={<PublicShare />} />

        <Route path="/home" element={<Home onLogout={handleLogout} isAuthenticated={isAuthenticated} />} />
        <Route path="/profile" element={requireAuth(<Profile />)} />
        <Route path="/saved-posts" element={requireAuth(<SavedPosts />)} />
        <Route path="/post" element={requireAuth(<Post />)} />
        <Route path="/posts/:id/comments" element={requireAuth(<PostComments />)} />
        <Route path="/settings" element={requireAuth(<Settings />)} />
        <Route path="/settings/other" element={requireAuth(<OtherSettings />)} />
        <Route path="/settings/about" element={requireAuth(<AboutSettings />)} />
        <Route path="/share" element={requireAuth(<ShareApp />)} />
        <Route path="/chat" element={requireAuth(<ChatPage />)} />
        <Route path="/chat/:id" element={requireAuth(<ChatPage />)} />
        <Route path="/calendar" element={requireAuth(<CalendarPage />)} />
        <Route path="/tutorials" element={requireAuth(<Tutorials isAuthenticated={isAuthenticated} />)} />
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
        <Route path="/notifications" element={requireAuth(<Notifications />)} />
        <Route path="/user/:id/friends" element={requireAuth(<UserFriends />)} />
      </Routes>

      {/* Global Workout Prompt Modal */}
      <GlobalWorkoutPrompt />

      {/* Global notification toast rendered inside Router so it can navigate */}
      <NotificationToast />
    </WorkoutReminderProvider>
    </LanguageProvider>
    </Router>
  );

  // Global Workout Prompt Component
  function GlobalWorkoutPrompt() {
    const { showWorkoutPrompt, todayWorkout, closePrompt, dismissPrompt } = useWorkoutReminder();
    const navigate = useNavigate();
    const [theme] = useState(localStorage.getItem('theme') || 'light');
    const isDark = theme === 'dark';

    console.log('🏋️ GlobalWorkoutPrompt state:', { showWorkoutPrompt, todayWorkout });

    if (!showWorkoutPrompt || !todayWorkout) return null;

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
      } catch (e) {
        console.error('Failed to clean local plan on cancel:', e);
      }
    };

    const cancelWorkoutServer = async (reason) => {
      if (!todayWorkout?.scheduleId) return;
      try {
        const res = await fetch(`${API_BASE.replace('/api', '')}/api/workout-schedules/${todayWorkout.scheduleId}${reason ? `?reason=${reason}` : ''}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok && res.status !== 404) {
          throw new Error(`Cancel failed: ${res.status}`);
        }
      } catch (e) {
        console.error('Failed to cancel workout on server:', e);
      }
    };

    const handlePostWorkout = () => {
      dismissPrompt();
      navigate('/post');
    };

    const declineInviteIfNeeded = async () => {
      if (!todayWorkout?.isInvite || !todayWorkout?.participantId) return;
      try {
        await fetch(`${API_BASE.replace('/api', '')}/api/workout-schedules/invites/${todayWorkout.participantId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: 'declined' })
        });
      } catch (e) {
        console.error('Failed to decline invite on Not Now:', e);
      }
    };

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
          }).catch(e => console.error('Failed to create cancellation notification:', e));
        }
      } catch (e) {
        console.error('Failed to create cancellation notification:', e);
      }
      
      dismissPrompt();
    };

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
          console.error('Failed to accept workout invite:', err);
          alert('Failed to accept invite');
        });
      }
    };

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
          console.error('Failed to decline workout invite:', err);
          alert('Failed to decline invite');
        });
      }
    };

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

  function NotificationToast() {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return undefined;

      const socket = io(SOCKET_BASE, getSocketOptions(token));

      const handleNotification = (data) => {
        if (!data) return;
        let payload = data.data || {};
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            payload = { content: payload };
          }
        }
        setToast({ type: data.type || 'notification', payload });
      };

      socket.on('notification:new', handleNotification);

      return () => {
        try {
          socket.off('notification:new', handleNotification);
          socket.disconnect();
        } catch (err) {
          console.error('Failed to disconnect notification socket:', err);
        }
      };
    }, []);

    useEffect(() => {
      if (!toast) return undefined;
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }, [toast]);

    if (!toast) return null;
    const { type, payload } = toast;

    const onClick = () => {
      setToast(null);
      if (type === 'message' && payload?.fromUserId) {
        navigate(`/chat/${payload.fromUserId}`);
      } else {
        navigate('/notifications');
      }
    };

    return (
      <div onClick={onClick} className="fixed right-4 top-4 z-50 bg-white shadow-lg rounded p-3 cursor-pointer">
        <div className="font-medium">You got a new {type === 'message' ? 'message' : type}</div>
        {type === 'message' && payload?.content && (
          <div className="text-sm text-gray-600 mt-1 truncate" style={{ maxWidth: 220 }}>
            {payload.content}
          </div>
        )}
      </div>
    );
  }

  function SplashLoader() {
    const [theme] = useState(localStorage.getItem('theme') || 'light');
    const isDark = theme === 'dark';
    
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

export default App;
