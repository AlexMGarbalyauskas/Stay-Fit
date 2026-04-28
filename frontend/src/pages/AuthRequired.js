// The AuthRequired component is displayed when a user 
// tries to access a page that requires authentication 
// without being logged in. It provides a friendly 
// message and options to log in or register.
// The component also detects the current theme 
// (light or dark) and adjusts its styling accordingly. 
// It uses React Router's Link component to navigate 
// to the login and registration pages, passing along 
// the intended destination so that users can be 
// redirected back after successful authentication.



//immports
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import { Dumbbell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
//imports end 







// The AuthRequired component renders a message 
// prompting the user to log in or register,
export default function AuthRequired() {
  const { t } = useLanguage();
  const location = useLocation();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');


  // Listen for changes to the theme in 
  // localStorage to update the component's 
  // appearance in real-time
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem('theme') === 'dark');
    };
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  // Determine the current section based on the URL path
  const path = location.pathname || '';
  const section = path.split('/')[1] || '';

  // Define messages for different sections of the app,
  const messages = {
    find: t('authRequiredFindDesc'),
    post: t('authRequiredPostDesc'),
    chat: t('authRequiredChatDesc'),
    friends: t('authRequiredFriendsDesc'),
    notifications: t('authRequiredNotificationsDesc'),
    profile: t('authRequiredProfileDesc'),
  };


  // and select the appropriate message based on the current section.
  const description = messages[section] || t('authRequiredDefaultDesc');




  


  // The component's JSX structure includes a header,
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
            <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('authRequiredTitle')}</h1>
            <p className={`text-lg px-4 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>{description}</p>
          </div>

          <div className="flex flex-col gap-4 mt-12">
            <Link
              to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
              className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t('goToLogin')}
            </Link>
            <Link
              to={`/register?next=${encodeURIComponent(location.pathname + location.search)}`}
              className={`w-full border-2 py-4 rounded-2xl font-semibold text-lg transition-all shadow-md ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-gray-100 hover:bg-gray-800 hover:border-gray-600'
                  : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {t('createAnAccount')}
            </Link>
          </div>

          <p className={`text-xs mt-8 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {t('agreeToTermsAndPrivacy')}
          </p>
        </div>
      </div>
      
      <Navbar />
    </>
  );
}
