import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import { Dumbbell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AuthRequired() {
  const { t } = useLanguage();
  const location = useLocation();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem('theme') === 'dark');
    };
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  const path = location.pathname || '';
  const section = path.split('/')[1] || '';

  const messages = {
    find: 'Log in to discover and add new fitness friends.',
    post: 'Log in to share your workouts, updates, and moments.',
    chat: 'Log in to chat with friends and keep conversations going.',
    friends: 'Log in to view and manage your friends list.',
    notifications: 'Log in to see your notifications, invites, and requests.',
    profile: 'Log in to view and edit your profile.',
  };

  const description = messages[section] || 'Log in or create an account to access this page.';

  return (
    <>
      <Header disableNotifications />
      <div className={`min-h-screen pb-24 pt-20 ${
        isDark
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800'
          : 'bg-gradient-to-br from-blue-50 to-green-100'
      }`}>
        <div className="px-4 max-w-md mx-auto text-center mt-20">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
            <h1 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>Login required</h1>
            <p className={`text-lg px-4 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>{description}</p>
          </div>

          <div className="flex flex-col gap-4 mt-12">
            <Link
              to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Go to Login
            </Link>
            <Link
              to={`/register?next=${encodeURIComponent(location.pathname + location.search)}`}
              className={`w-full border-2 py-4 rounded-2xl font-semibold text-lg transition-all shadow-md ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-gray-100 hover:bg-gray-800 hover:border-gray-600'
                  : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              Create an Account
            </Link>
          </div>

          <p className={`text-xs mt-8 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      <Navbar />
    </>
  );
}
