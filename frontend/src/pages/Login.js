//notification for unregistered email on google login
// This component handles user login, including traditional 
// username/password and Google OAuth. It also manages post-login 
// redirection based on onboarding status and initializes encryption 
// for secure data handling.






//imports 
import { useState, useEffect } from 'react';
import { login, API_BASE } from '../api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { initializeEncryption } from '../utils/crypto';
import { useLanguage } from '../context/LanguageContext';
//imports end 









//main component
export default function Login({ onLogin }) {
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');



   //use effect 1 
  // Listen for theme changes to update the component's appearance
  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem('theme') === 'dark');
    };
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);
//use effect 1 end







  //const for form inputs and error handling
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  //const end 






  //block 1
  // Handles post-login redirection based on onboarding status
  const handlePostLoginRedirect = (user) => {
    const userId = user?.id;
    if (!userId) {
      navigate('/home');
      return;
    }

    // Check if onboarding is pending and if the user has completed it
    const doneKey = `onboarding_done_${userId}`;
    const pending = localStorage.getItem('onboarding_pending') === 'true';
    if (pending && !localStorage.getItem(doneKey)) {
      navigate('/onboarding?auto=1');
      return;
    }

    // If onboarding is pending but the user has completed it, clear the pending flag
    if (pending && localStorage.getItem(doneKey)) {
      localStorage.removeItem('onboarding_pending');
    }
    navigate('/home');
  };
  //block 1 end







//use effect 2
  // Check for Google OAuth tokens and handle login state on component mount
  useEffect(() => {

    // Parse URL parameters for token, user data, and errors
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const errorParam = params.get('error');
    const emailParam = params.get('email');
    
    // Check for errors from Google OAuth
    if (errorParam === 'please_register') {
      setError(`This email is not registered. Please sign up first using "Register with Google".`);
      return;
    }
    
    // If we have a token, log the user in
    if (token) {
      localStorage.setItem('token', token);
      if (userParam) {

        // Store user data in localStorage and initialize encryption
        localStorage.setItem('user', userParam);
        try {

          // Parse user data and initialize encryption
          const user = JSON.parse(userParam);
          // Initialize encryption for OAuth login using token as seed
          initializeEncryption(token + user.id);
          if (onLogin) onLogin();
          handlePostLoginRedirect(user);
        } catch (e) {
          console.error('Failed to parse user data:', e);
          if (onLogin) onLogin();
          navigate('/home');
        }
        return;
      }
      if (onLogin) onLogin();
      navigate('/home');
    }
  }, [location.search, navigate, onLogin]);
//use effect 2 end








//block 1 
  // Handles traditional username/password login
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous errors
    try {
      const res = await login(identifier, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Initialize encryption with user's credentials
      initializeEncryption(password + res.data.user.id);
      
      // Set onboarding pending flag if this is the user's first login
      if (onLogin) onLogin();
      handlePostLoginRedirect(res.data.user);

      // Set onboarding pending flag if user is logging in for the first time
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Login failed');
    }
  };
  //block 1 end







  //block 2
  // Handles Google OAuth login by redirecting to the backend endpoint
  const handleGoogleLogin = () => {
    const frontendOrigin = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE}/api/auth/google/login?frontend=${frontendOrigin}`;
  };
//block 2 end









  // main render 
  // Render the login form with appropriate styling based on the theme
  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-md ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`} style={{ wordSpacing: '0.15em' }}>{t('login')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
            placeholder={t('usernameOrEmail')}
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
          />
          <input
            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            className="w-full bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors"
            type="submit"
          >
            {t('login')}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className={`w-full border p-3 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}
          >
            <img
              src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png"
              alt="Google logo"
              className="w-6 h-6 mr-2"
              loading="lazy"
            />
            {t('loginWithGoogle')}
          </button>
        </div>

        <p className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('dontHaveAccount')}{' '}
          <Link className="text-blue-500 hover:underline" to="/register">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
  //render end 
}
