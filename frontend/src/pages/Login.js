import { useState, useEffect } from 'react';
import { login, API_BASE } from '../api';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { initializeEncryption } from '../utils/crypto';
import { useLanguage } from '../context/LanguageContext';

export default function Login({ onLogin }) {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    if (token) {
      localStorage.setItem('token', token);
      if (userParam) {
        localStorage.setItem('user', userParam);
        try {
          const user = JSON.parse(userParam);
          // Initialize encryption for OAuth login using token as seed
          initializeEncryption(token + user.id);
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      if (onLogin) onLogin();
      navigate('/home');
    }
  }, [location.search, navigate, onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(identifier, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Initialize encryption with user's credentials
      initializeEncryption(password + res.data.user.id);
      
      if (onLogin) onLogin();
      navigate('/home');
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('login')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('usernameOrEmail')}
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
          />
          <input
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border border-gray-300 p-3 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
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

        <p className="mt-4 text-center text-gray-600">
          {t('dontHaveAccount')}{' '}
          <Link className="text-blue-500 hover:underline" to="/register">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
