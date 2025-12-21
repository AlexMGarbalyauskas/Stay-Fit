import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    </Router>
  );
}

export default App;
