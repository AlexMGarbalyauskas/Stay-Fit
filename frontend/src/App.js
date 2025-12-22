import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SocialLogin from './pages/SocialLogin';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import FindFriends from './pages/FindFriends';
import FriendRequests from './pages/FriendRequests';
import UserProfile from './pages/UserProfile';
import Notifications from './pages/Notifications';
import Friends from './pages/Friends';
import ChatPage from './pages/ChatPage';
import { io } from 'socket.io-client';
import { API_BASE } from './api';

function App() {
  const [refreshFriends, setRefreshFriends] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return !!localStorage.getItem('token') && !!JSON.parse(localStorage.getItem('user'));
    } catch {
      return false;
    }
  });

  const triggerFriendRefresh = () => setRefreshFriends(prev => prev + 1);

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
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
        <Route path="/register" element={!isAuthenticated ? <Register onRegister={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />
        <Route path="/social-login" element={!isAuthenticated ? <SocialLogin onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/home" />} />

        <Route path="/home" element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/chat" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/chat/:id" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />

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
      </Routes>

      {/* Global notification toast rendered inside Router so it can navigate */}
      <NotificationToast />
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
}

export default App;
