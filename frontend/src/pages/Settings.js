import { useState, useEffect } from 'react';
import { User, Share2, LogOut, ArrowLeft, Bell, Lock, Globe, Star, Moon, Sun, Check, X, Wrench, Info, Languages } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { updateMe } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const { language, setLanguage: setGlobalLanguage, t } = useLanguage();
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
  const [showShareNotification, setShowShareNotification] = useState(false);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const tosAcceptedAt = localStorage.getItem('tosAcceptedAt');

  const privacyLabel = (value) => {
    if (value === 'Public') return t('public');
    if (value === 'Friends Only') return t('friendsOnly');
    if (value === 'Private') return t('private');
    return value;
  };

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
        setCurrentTime(t('invalidTimezone'));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone, t]);

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

  const handleLanguageChange = (newLanguage) => {
    setGlobalLanguage(newLanguage);
  };

  const handleLogout = () => {
    const savedLanguage = localStorage.getItem('language');
    const savedTheme = localStorage.getItem('theme');
    localStorage.clear();
    if (savedLanguage) localStorage.setItem('language', savedLanguage);
    if (savedTheme) localStorage.setItem('theme', savedTheme);
    window.location.href = '/';
  };

  const handleShareAccount = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 3000);
  };

  const handleRateApp = () => {
    alert(t('rateApp'));
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
      alert(t('failedToUpdatePrivacy'));
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
      alert(t('failedToUpdateTimezone'));
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
      alert(t('failedToUpdateNotifications'));
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

  if (!user) return <p className="text-center mt-20 text-gray-500">{t('loading')}</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="pt-20 pb-20 px-4 max-w-md mx-auto">

        {/* Back button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-700 mb-4 hover:text-gray-900"
        >
          <ArrowLeft size={20} /> {t('backToProfile')}
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
          <h3 className="font-semibold text-gray-700 mb-2">{t('features')}</h3>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              <span className="text-gray-700">{theme === 'light' ? t('lightMode') : t('darkMode')}</span>
            </div>
            <button
              onClick={handleThemeToggle}
              className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Languages size={20} />
              <span className="text-gray-700">{t('language')}</span>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="border rounded px-3 py-1 text-sm bg-white text-gray-700 hover:bg-gray-50 transition"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="it">Italiano</option>
            </select>
          </div>
        </div>

        {/* Settings Section */}
        <div className="mt-4 bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">{t('settings')}</h3>

          {/* Notifications */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Bell size={20} />
              <span className="text-gray-700">{t('notificationSettings')}</span>
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
              <span className="text-gray-700">{t('privacy')}</span>
            </div>
            <select
              value={privacy}
              onChange={e => handlePrivacyChange(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="Public">{t('public')}</option>
              <option value="Friends Only">{t('friendsOnly')}</option>
              <option value="Private">{t('private')}</option>
            </select>
          </div>

          {/* Timezone */}
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2 transition"
            onClick={handleTimezoneClick}
          >
            <div className="flex items-center gap-2">
              <Globe size={20} />
              <span className="text-gray-700">{t('timezone')}</span>
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

          {/* Other settings */}
          <button
            onClick={() => navigate('/settings/other')}
            className="flex items-center gap-2 py-2 w-full text-left text-gray-900 hover:bg-gray-100 rounded"
          >
            <Wrench size={20} className="text-gray-900" /> {t('other')}
          </button>
        </div>

        {/* About Section */}
        <div className="mt-4 bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-gray-700 mb-2">{t('about')}</h3>
          <button
            onClick={() => navigate('/settings/about')}
            className="flex items-center gap-2 py-2 w-full text-left text-gray-900 hover:bg-gray-100 rounded"
          >
            <Info size={20} className="text-gray-900" /> {t('about')}
          </button>
          <button
            onClick={() => navigate('/share')}
            className="flex items-center gap-2 py-2 w-full text-left text-gray-900 hover:bg-gray-100 rounded"
          >
            <Share2 size={20} className="text-gray-900" /> {t('shareApp')}
          </button>
          <button
            onClick={handleRateApp}
            className="flex items-center gap-2 py-2 w-full text-left text-gray-900 hover:bg-gray-100 rounded"
          >
            <Star size={20} className="text-gray-900" /> {t('rateApp')}
          </button>
        </div>

        {/* Logout */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
          >
            <LogOut size={20} /> {t('logout')}
          </button>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 px-4 ${
            isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black bg-opacity-50'
          }`}
        >
          <div
            className={`rounded-lg p-6 max-w-md w-full mx-auto shadow-xl ${
              isDark
                ? 'bg-gray-900 text-gray-100 border border-gray-800'
                : 'bg-white'
            }`}
          >
            <div className="text-center mb-4">
              <Lock className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-50' : 'text-gray-900'}`}>{t('confirmPrivacyChange')}</h3>
              <p className={isDark ? 'text-gray-300 mb-1' : 'text-gray-700 mb-1'}>
                {t('changingPrivacyTo')}
              </p>
              <p className={`text-lg font-semibold mb-3 ${isDark ? 'text-gray-50' : 'text-gray-900'}`}>
                {privacyLabel(pendingPrivacy)}
              </p>
              <div className={`text-sm p-3 rounded mb-4 text-left ${isDark ? 'text-gray-200 bg-gray-800' : 'text-gray-800 bg-gray-100'}`}>
                {pendingPrivacy === 'Public' && (
                  <p>{t('publicDesc')}</p>
                )}
                {pendingPrivacy === 'Friends Only' && (
                  <p>{t('friendsOnlyDesc')}</p>
                )}
                {pendingPrivacy === 'Private' && (
                  <p>{t('privateDesc')}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelPrivacyChange}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              >
                <X size={18} />
                {t('cancel')}
              </button>
              <button
                onClick={confirmPrivacyChange}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <Check size={18} />
                {t('confirm')}firm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timezone Modal */}
      {showTimezoneModal && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 px-4 ${
            isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black bg-opacity-50'
          }`}
        >
          <div
            className={`rounded-lg shadow-xl p-6 max-w-md w-full mx-auto max-h-[65vh] flex flex-col ${
              isDark
                ? 'bg-gray-900 text-gray-100 border border-gray-800'
                : 'bg-white'
            }`}
          >
            <div className="text-center mb-4">
              <Globe className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-50' : 'text-gray-900'}`}>{t('changeTimezone')}</h3>
              <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('currentTime')}: <span className={isDark ? 'font-semibold text-gray-100' : 'font-semibold text-gray-900'}>{currentTime}</span>
              </p>
              <p className={isDark ? 'text-xs text-gray-400' : 'text-xs text-gray-700'}>
                {t('selectTimezone')}
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
                        ? isDark
                          ? 'bg-blue-900/30 border-2 border-blue-500 text-blue-100'
                          : 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                        : isDark
                          ? 'bg-gray-800 hover:bg-gray-700 border-2 border-transparent text-gray-100'
                          : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="font-medium text-sm">{tz.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={cancelTimezoneChange}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                  isDark
                    ? 'bg-gray-800 text-gray-100 hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <X size={18} />
                {t('cancel')}
              </button>
              <button
                onClick={confirmTimezoneChange}
                disabled={!pendingTimezone}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                  pendingTimezone
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : isDark
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Check size={18} />
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Notification */}
      {showShareNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-semibold">{t('profileLinkCopied')}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          0% { transform: translate(-50%, -100%); opacity: 0; }
          10% { transform: translate(-50%, 0); opacity: 1; }
          90% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, 20px); opacity: 0; }
        }
        .animate-slideDown {
          animation: slideDown 3s ease-out forwards;
        }
      `}</style>

      <Navbar />

    </div>
  );
}
