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
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DebugOverlay from './components/DebugOverlay';
import { WorkoutReminderProvider, useWorkoutReminder } from './context/WorkoutReminderContext';
import { io } from 'socket.io-client';
import { API_BASE } from './api';
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
      <WorkoutReminderProvider>
        {booting && <SplashLoader />}
        <Routes>
        <Route path="/" element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
        <Route path="/register" element={!isAuthenticated ? <Register onRegister={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
        <Route path="/social-login" element={!isAuthenticated ? <SocialLogin onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />

        <Route path="/home" element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/saved-posts" element={isAuthenticated ? <SavedPosts /> : <Navigate to="/login" />} />
        <Route path="/post" element={isAuthenticated ? <Post /> : <Navigate to="/login" />} />
        <Route path="/posts/:id/comments" element={isAuthenticated ? <PostComments /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/settings/other" element={isAuthenticated ? <OtherSettings /> : <Navigate to="/login" />} />
        <Route path="/settings/about" element={isAuthenticated ? <AboutSettings /> : <Navigate to="/login" />} />
        <Route path="/chat" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/chat/:id" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/calendar" element={isAuthenticated ? <CalendarPage /> : <Navigate to="/login" />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route
          path="/find"
          element={isAuthenticated ? <FindFriends onFriendUpdate={triggerFriendRefresh} /> : <Navigate to="/login" />}
        />
        <Route
          path="/friend-requests"
          element={isAuthenticated ? <FriendRequests onFriendUpdate={triggerFriendRefresh} /> : <Navigate to="/login" />}
        />
        <Route
          path="/friends"
          element={isAuthenticated ? <Friends refreshTrigger={refreshFriends} /> : <Navigate to="/login" />}
        />
        <Route path="/users/:id" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/user/:id/friends" element={<UserFriends />} />
      </Routes>

      {/* Global Workout Prompt Modal */}
      <GlobalWorkoutPrompt />

      {/* Global notification toast rendered inside Router so it can navigate */}
      <NotificationToast />
    </WorkoutReminderProvider>
    </Router>
  );

  // Global Workout Prompt Component
  function GlobalWorkoutPrompt() {
    const { showWorkoutPrompt, todayWorkout, closePrompt, dismissPrompt } = useWorkoutReminder();
    const navigate = useNavigate();

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            
            {todayWorkout.isInvite ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Workout Invite! 🎉</h2>
                <p className="text-lg text-gray-700 mb-1">
                  <span className="font-bold text-blue-600">{todayWorkout.creatorUsername}</span> invited you to a <span className="font-bold text-blue-600">{todayWorkout.workout}</span> workout
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {todayWorkout.date && `📅 ${todayWorkout.date}`} {todayWorkout.time && `⏰ ${todayWorkout.time}`}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDeclineInvite}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Workout Time! 🏋️</h2>
                <p className="text-lg text-gray-700 mb-1">It's time for your <span className="font-bold text-blue-600">{todayWorkout.workout}</span> workout!</p>
                <p className="text-sm text-gray-500 mb-6">Ready to post your workout video?</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSkipWorkout}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
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

  return (
    <Router>
      <WorkoutReminderProvider>
        {booting && <SplashLoader />}
        <Routes>
          <Route path="/" element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
          <Route path="/register" element={!isAuthenticated ? <Register onRegister={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
          <Route path="/social-login" element={!isAuthenticated ? <SocialLogin onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />

          <Route path="/home" element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/saved-posts" element={isAuthenticated ? <SavedPosts /> : <Navigate to="/login" />} />
          <Route path="/post" element={isAuthenticated ? <Post /> : <Navigate to="/login" />} />
          <Route path="/posts/:id/comments" element={isAuthenticated ? <PostComments /> : <Navigate to="/login" />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/settings/other" element={isAuthenticated ? <OtherSettings /> : <Navigate to="/login" />} />
          <Route path="/settings/about" element={isAuthenticated ? <AboutSettings /> : <Navigate to="/login" />} />
          <Route path="/chat" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
          <Route path="/chat/:id" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
          <Route path="/calendar" element={isAuthenticated ? <CalendarPage /> : <Navigate to="/login" />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route
            path="/find"
            element={isAuthenticated ? <FindFriends onFriendUpdate={triggerFriendRefresh} /> : <Navigate to="/login" />}
          />
          <Route
            path="/friend-requests"
            element={isAuthenticated ? <FriendRequests onFriendUpdate={triggerFriendRefresh} /> : <Navigate to="/login" />}
          />
          <Route
            path="/friends"
            element={isAuthenticated ? <Friends refreshTrigger={refreshFriends} /> : <Navigate to="/login" />}
          />
          <Route path="/users/:id" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/user/:id/friends" element={<UserFriends />} />
        </Routes>

        {/* Global Workout Prompt Modal */}
        <GlobalWorkoutPrompt />

        {/* Global notification toast rendered inside Router so it can navigate */}
        <NotificationToast />
      </WorkoutReminderProvider>
    </Router>
  );

  // Notification toast component
  function NotificationToast() {
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const socket = io(API_BASE.replace('/api',''), { auth: { token } });
      socket.on('notification:new', (data) => {
        setToast({ data });
        // auto-hide
        setTimeout(() => setToast(null), 5000);
        // If it's a post notification, trigger a feed refresh
        try {
          if (data?.type === 'post') {
            window.dispatchEvent(new CustomEvent('feed:refresh', { detail: { fromUserId: data.fromUserId, postId: data.postId } }));
          }
        } catch (e) {}
      });
      // forward post comments updates to pages
      socket.on('post:commentsUpdated', (data) => {
        try { window.dispatchEvent(new CustomEvent('post:commentsUpdated', { detail: data })); } catch (e) {}
      });
      // Listen for explicit post:new to refresh feed
      socket.on('post:new', (data) => {
        try { window.dispatchEvent(new CustomEvent('feed:refresh', { detail: data })); } catch (e) {}
      });
      return () => socket.disconnect();
    }, []);

    if (!toast) return null;

    const payload = toast.data;
    const type = payload.type;

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
        {type === 'message' && payload?.content && <div className="text-sm text-gray-600 mt-1 truncate" style={{maxWidth: 220}}>{payload.content}</div>}
      </div>
    );
  }

  function SplashLoader() {
    return (
      <div className="loader-overlay">
        <div className="loader-swirl">
          <span className="dot dot-a" />
          <span className="dot dot-b" />
          <span className="dot dot-c" />
        </div>
        <div className="loader-text">Loading Stay Fit…</div>
      </div>
    );
  }
}

export default App;
