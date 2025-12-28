import { useState, useEffect } from 'react';
import { User, Share2, LogOut, ArrowLeft, Bell, Lock, Globe, Star, FileText, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState('Public');
  const [timezone, setTimezone] = useState('Europe');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const tosAcceptedAt = localStorage.getItem('tosAcceptedAt');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_URL}/api/me`, authHeaders) // ✅ Added /api
      .then(res => setUser(res.data.user))
      .catch(err => console.error('Error fetching user:', err));
  }, [token, API_URL]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleShareAccount = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Profile link copied!');
  };

  const handleRateApp = () => {
    alert('Thanks for rating our app!');
  };

  if (!user) return <p className="text-center mt-20 text-gray-500">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="pt-20 pb-20 px-4 max-w-md mx-auto">

        {/* Back button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-700 mb-4 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> Back to Profile
        </button>

        {/* Profile Info */}
        <div className="flex items-center gap-4 bg-white p-4 rounded shadow">
          {user.profile_picture ? (
            <img
              src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">@{user.username}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">Features</h3>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              <span className="text-gray-700">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
            </div>
            <button
              onClick={handleThemeToggle}
              className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>

        {/* Settings Section */}
        <div className="mt-4 bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">Settings</h3>

          {/* Notifications */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Bell size={20} />
              <span className="text-gray-700">Notifications</span>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Lock size={20} />
              <span className="text-gray-700">Privacy</span>
            </div>
            <select
              value={privacy}
              onChange={e => setPrivacy(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option>Public</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Globe size={20} />
              <span className="text-gray-700">Timezone</span>
            </div>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option>Europe</option>
              <option>America</option>
              <option>Asia</option>
            </select>
          </div>

          {/* Other */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Other</span>
            <span className="text-gray-400">Coming soon</span>
          </div>

          {/* Terms of Service */}
          <button
            onClick={() => navigate('/terms')}
            className="flex items-center justify-between w-full py-2 hover:bg-gray-50 rounded mt-2"
          >
            <div className="flex items-center gap-2">
              <FileText size={20} />
              <span className="text-gray-700">Terms of Service</span>
            </div>
            <span className="text-xs text-gray-500">{tosAcceptedAt ? `Agreed: ${new Date(tosAcceptedAt).toLocaleDateString()}` : 'Not accepted'}</span>
          </button>
        </div>

        {/* About Section */}
        <div className="mt-4 bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">About</h3>
          <button
            onClick={handleShareAccount}
            className="flex items-center gap-2 py-2 w-full text-left text-gray-700 hover:bg-gray-100 rounded"
          >
            <Share2 size={20} /> Share Account
          </button>
          <button
            onClick={handleRateApp}
            className="flex items-center gap-2 py-2 w-full text-left text-gray-700 hover:bg-gray-100 rounded"
          >
            <Star size={20} /> Rate App
          </button>
        </div>

        {/* Logout */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>
      <Navbar />
    </div>
  );
}
