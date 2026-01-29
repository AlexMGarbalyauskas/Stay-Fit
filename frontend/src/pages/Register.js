import { useState, useEffect } from 'react';
import { register, API_BASE } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem('theme') === 'dark');
    };
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  const DRAFT_KEY = 'register_form_draft';

  const loadDraft = () => {
    try {
      const draftRaw = localStorage.getItem(DRAFT_KEY);
      if (!draftRaw) return {};
      return JSON.parse(draftRaw) || {};
    } catch {
      return {};
    }
  };

  const initialDraft = loadDraft();

  const [username, setUsername] = useState(initialDraft.username || '');
  const [email, setEmail] = useState(initialDraft.email || '');
  const [password, setPassword] = useState(initialDraft.password || '');
  const [passwordConfirm, setPasswordConfirm] = useState(initialDraft.passwordConfirm || '');
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(!!initialDraft.agree);
  const [tosRead, setTosRead] = useState(() => !!localStorage.getItem('tosAccepted'));
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setTosRead(!!localStorage.getItem('tosAccepted'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Load draft from local storage so inputs survive visiting Terms page and back
  useEffect(() => {
    try {
      const draftRaw = localStorage.getItem(DRAFT_KEY);
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        setUsername(draft.username || '');
        setEmail(draft.email || '');
        setPassword(draft.password || '');
        setPasswordConfirm(draft.passwordConfirm || '');
        setAgree(!!draft.agree);
      }
    } catch (e) {
      console.error('Failed to load draft', e);
    }
  }, []);

  // Persist draft while user types
  useEffect(() => {
    const draft = { username, email, password, passwordConfirm, agree };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [username, email, password, passwordConfirm, agree]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (!tosRead || !agree) {
      setError('Please read and accept the Terms of Service before registering.');
      return;
    }
    try {
      await register(username, email, password);
      localStorage.removeItem(DRAFT_KEY);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-md ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('register')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
            placeholder={t('username')}
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <input
            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
            placeholder={t('email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <input
            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
            type="password"
            placeholder={t('confirmPassword')}
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
          />

          {/* Terms of Service gate */}
          <div className={`text-sm border rounded-xl p-3 ${isDark ? 'text-gray-300 bg-gray-800 border-gray-700' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
            <p className="mb-2">{t('readTerms')} <Link className="text-blue-600 underline" to="/terms">Terms of Service</Link>.</p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
              <span>{t('acceptTerms')}</span>
              <span className={`ml-auto text-xs ${tosRead ? 'text-green-600' : 'text-red-500'}`}>{tosRead ? t('loading') : 'Please read terms'}</span>
            </div>
          </div>

          <button
            className={`w-full p-3 rounded-xl transition-colors ${agree && tosRead ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            type="submit"
            disabled={!agree || !tosRead}
          >
            {t('register')}
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        <div className="mt-6">
          <button
            onClick={() => {
              if (!tosRead) { alert('Please read the Terms of Service first.'); return; }
              if (!agree) { alert('Please accept the Terms of Service.'); return; }
              handleGoogleRegister();
            }}
            className={`w-full border p-3 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}
          >
            <img
              src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png"
              alt="Google logo"
              className="w-6 h-6 mr-2"
              loading="lazy"
            />
            {t('registerWithGoogle')}
          </button>
        </div>

        <p className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {t('alreadyHaveAccount')}{' '}
          <Link className="text-blue-500 hover:underline" to="/login">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
