import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import { Dumbbell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AuthRequired() {
  const { t } = useLanguage();
  const location = useLocation();

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-24 pt-20">
        <div className="px-4 max-w-md mx-auto text-center mt-20">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Login required</h1>
            <p className="text-gray-600 text-lg px-4">{description}</p>
          </div>

          <div className="flex flex-col gap-4 mt-12">
            <Link
              to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Go to Login
            </Link>
            <Link
              to={`/register?next=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full bg-white border-2 border-gray-200 text-gray-800 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
            >
              Create an Account
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      <Navbar />
    </>
  );
}
