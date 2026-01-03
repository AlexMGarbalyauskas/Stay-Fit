import { useState, useEffect } from 'react';
import { User, Share2, LogOut, ArrowLeft, Bell, Lock, Globe, Star, FileText, Moon, Sun, Check, X } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { updateMe } from '../api';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [privacy, setPrivacy] = useState('Public');
  const [pendingPrivacy, setPendingPrivacy] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [pendingTimezone, setPendingTimezone] = useState(null);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
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
      .then(res => {
        setUser(res.data.user);
        setPrivacy(res.data.user.privacy || 'Public');
        setTimezone(res.data.user.timezone || 'UTC');
        setNotifications(res.data.user.notifications_enabled !== 0);
      })
      .catch(err => console.error('Error fetching user:', err));
  }, [token, API_URL]);

  // Update current time every second based on timezone
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        setCurrentTime(formatter.format(now));
      } catch (error) {
        setCurrentTime('Invalid timezone');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

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

  const handlePrivacyChange = (newPrivacy) => {
    setPendingPrivacy(newPrivacy);
    setShowConfirmModal(true);
  };

  const confirmPrivacyChange = async () => {
    try {
      const response = await updateMe({ privacy: pendingPrivacy });
      setPrivacy(pendingPrivacy);
      setUser(response.data.user);
      setShowConfirmModal(false);
      setPendingPrivacy(null);
    } catch (error) {
      console.error('Error updating privacy:', error);
      alert('Failed to update privacy setting');
    }
  };

  const cancelPrivacyChange = () => {
    setShowConfirmModal(false);
    setPendingPrivacy(null);
  };

  const handleTimezoneClick = () => {
    setShowTimezoneModal(true);
  };

  const handleTimezoneChange = (newTimezone) => {
    setPendingTimezone(newTimezone);
  };

  const confirmTimezoneChange = async () => {
    try {
      const response = await updateMe({ timezone: pendingTimezone });
      setTimezone(pendingTimezone);
      setUser(response.data.user);
      setShowTimezoneModal(false);
      setPendingTimezone(null);
    } catch (error) {
      console.error('Error updating timezone:', error);
      alert('Failed to update timezone');
    }
  };

  const cancelTimezoneChange = () => {
    setShowTimezoneModal(false);
    setPendingTimezone(null);
  };

  const handleNotificationToggle = async () => {
    const newValue = !notifications;
    try {
      const response = await updateMe({ notifications_enabled: newValue });
      setNotifications(newValue);
      setUser(response.data.user);
    } catch (error) {
      console.error('Error updating notifications:', error);
      alert('Failed to update notification settings');
    }
  };

  // Common timezones
  const commonTimezones = [
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
    { label: 'Europe/Dublin (Ireland)', value: 'Europe/Dublin' },
    { label: 'Europe/London (UK)', value: 'Europe/London' },
    { label: 'Europe/Paris (France, Spain, Germany)', value: 'Europe/Paris' },
    { label: 'Europe/Berlin (Central Europe)', value: 'Europe/Berlin' },
    { label: 'Europe/Athens (Greece, Eastern Europe)', value: 'Europe/Athens' },
    { label: 'America/New_York (US Eastern)', value: 'America/New_York' },
    { label: 'America/Chicago (US Central)', value: 'America/Chicago' },
    { label: 'America/Denver (US Mountain)', value: 'America/Denver' },
    { label: 'America/Los_Angeles (US Pacific)', value: 'America/Los_Angeles' },
    { label: 'America/Toronto (Canada Eastern)', value: 'America/Toronto' },
    { label: 'America/Vancouver (Canada Pacific)', value: 'America/Vancouver' },
    { label: 'Asia/Dubai (UAE)', value: 'Asia/Dubai' },
    { label: 'Asia/Kolkata (India)', value: 'Asia/Kolkata' },
    { label: 'Asia/Shanghai (China)', value: 'Asia/Shanghai' },
    { label: 'Asia/Tokyo (Japan)', value: 'Asia/Tokyo' },
    { label: 'Asia/Singapore (Singapore)', value: 'Asia/Singapore' },
    { label: 'Australia/Sydney (Australia Eastern)', value: 'Australia/Sydney' },
    { label: 'Australia/Melbourne (Australia)', value: 'Australia/Melbourne' },
    { label: 'Pacific/Auckland (New Zealand)', value: 'Pacific/Auckland' },
  ];

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
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications}
                onChange={handleNotificationToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Lock size={20} />
              <span className="text-gray-700">Privacy</span>
            </div>
            <select
              value={privacy}
              onChange={e => handlePrivacyChange(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option>Public</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>

          {/* Timezone */}
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2 transition"
            onClick={handleTimezoneClick}
          >
            <div className="flex items-center gap-2">
              <Globe size={20} />
              <span className="text-gray-700">Timezone</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-800">
                {currentTime}
              </div>
              <div className="text-xs text-gray-600 mt-0.5 flex items-center justify-end gap-1">
                <span>{timezone}</span>
                {user?.location && (
                  <>
                    <span>•</span>
                    <span className="text-gray-400">{user.location}</span>
                  </>
                )}
              </div>
            </div>
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-auto">
            <div className="text-center mb-4">
              <Lock className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Privacy Change</h3>
              <p className="text-gray-600 mb-1">
                You are changing your privacy setting to:
              </p>
              <p className="text-lg font-semibold text-gray-900 mb-3">
                {pendingPrivacy}
              </p>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded mb-4 text-left">
                {pendingPrivacy === 'Public' && (
                  <p>✓ Everyone can see your profile and posts</p>
                )}
                {pendingPrivacy === 'Friends Only' && (
                  <p>✓ Only your friends can see your profile and posts</p>
                )}
                {pendingPrivacy === 'Private' && (
                  <p>✓ Only you can see your profile and posts</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelPrivacyChange}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={confirmPrivacyChange}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Check size={18} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timezone Modal */}
      {showTimezoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-auto max-h-[80vh] flex flex-col">
            <div className="text-center mb-4">
              <Globe className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Change Timezone</h3>
              <p className="text-sm text-gray-600 mb-1">
                Current time: <span className="font-semibold">{currentTime}</span>
              </p>
              <p className="text-xs text-gray-500">
                Select your timezone or update your location in Profile for auto-detection
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-1">
                {commonTimezones.map((tz) => (
                  <button
                    key={tz.value}
                    onClick={() => handleTimezoneChange(tz.value)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      (pendingTimezone || timezone) === tz.value
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-sm">{tz.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <button
                onClick={cancelTimezoneChange}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={confirmTimezoneChange}
                disabled={!pendingTimezone}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                  pendingTimezone
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Check size={18} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
    </div>
  );
}
