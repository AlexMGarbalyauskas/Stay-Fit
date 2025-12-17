import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/social-login" element={<SocialLogin />} />
        <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/find" element={isAuthenticated ? <FindFriends /> : <Navigate to="/login" />} />
        <Route path="/friend-requests" element={isAuthenticated ? <FriendRequests /> : <Navigate to="/login" />} />
        <Route path="/users/:id" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
