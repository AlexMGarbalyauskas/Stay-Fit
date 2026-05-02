//Register.js used for user registration, including form 
// handling, validation, and integration 
// with Google OAuth for streamlined sign-up. 
// It also manages local storage for form drafts 
// and handles navigation post-registration.



//imports 
import { useState, useEffect } from 'react';
import { register, API_BASE } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
//imports end 



//main component 
export default function Register() {

  // Language context for internationalization
  const { t } = useLanguage();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');



  //use effect 1 
  // Listen for theme changes to update the component's appearance
  useEffect(() => {

    // Update the isDark state whenever the 'theme' value in local storage changes
    const handleThemeChange = () => {
      setIsDark(localStorage.getItem('theme') === 'dark');
    };

    // Listen for changes to the 'theme' key in local storage to update the component's theme dynamically
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);
  //use effect 1 end




// Local storage key for saving form drafts
  const DRAFT_KEY = 'register_form_draft';



  //block 1 
  const loadDraft = () => {
    try {
      const draftRaw = localStorage.getItem(DRAFT_KEY);
      if (!draftRaw) return {};
      return JSON.parse(draftRaw) || {};
    } catch {
      return {};
    }
  };
  //block 1 end


// State variables for form inputs and error handling
  const initialDraft = loadDraft();

  const [username, setUsername] = useState(initialDraft.username || '');
  const [email, setEmail] = useState(initialDraft.email || '');
  const [password, setPassword] = useState(initialDraft.password || '');
  const [passwordConfirm, setPasswordConfirm] = useState(initialDraft.passwordConfirm || '');
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(!!initialDraft.agree);
  const [tosRead, setTosRead] = useState(() => !!localStorage.getItem('tosAccepted'));
  const navigate = useNavigate();




  //use effect 2
  // Listen for changes to Terms of Service acceptance in local storage
  useEffect(() => {

    // Update the tosRead state whenever the 'tosAccepted' value in local storage changes
    const handler = () => setTosRead(!!localStorage.getItem('tosAccepted'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  //use effect 2 end








  //use effect 3
  // Load draft from local storage so inputs survive visiting Terms page and back
  useEffect(() => {

    // Load any saved draft from local storage when the component mounts
    try {

      // Attempt to load the draft from local storage and populate form fields
      const draftRaw = localStorage.getItem(DRAFT_KEY);

      // If a draft exists, parse it and set the form state accordingly
      if (draftRaw) {

        // If a draft exists, parse it and set the form state accordingly
        const draft = JSON.parse(draftRaw);
        setUsername(draft.username || '');
        setEmail(draft.email || '');
        setPassword(draft.password || '');
        setPasswordConfirm(draft.passwordConfirm || '');
        setAgree(!!draft.agree);
      }

      // Check if the user has already accepted the Terms of Service and update state
    } catch (e) {
      console.error('Failed to load draft', e);
    }
  }, []);
  //use effect 3 end











//use effect 4
  // Persist draft while user types
  useEffect(() => {

    // Save form state to local storage so it persists if the user navigates away (e.g., to read Terms) and comes back
    const draft = { username, email, password, passwordConfirm, agree };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [username, email, password, passwordConfirm, agree]);
  //use effect 4 end










//block 2
// Handle form submission with validation and API call
  const handleSubmit = async (e) => {

    // Validate password strength and confirmation before submitting
    e.preventDefault();
    const passwordRules = /^(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]).{8,}$/;
    if (!passwordRules.test(password)) {
      setError(t('passwordRulesError'));
      return;
    }

    // Ensure password and confirmation match
    if (password !== passwordConfirm) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    // Ensure Terms of Service is accepted before allowing registration
    if (!tosRead || !agree) {
      setError(t('acceptTermsBeforeRegistering'));
      return;
    }

    // Attempt to register the user via the API
    try {
      const response = await register(username, email, password);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem('onboarding_pending', 'true');

      // If the server indicates that email verification is required, navigate to the verification page
      if (response.data?.requiresVerification) {

        // If email verification is required, navigate to the verification page with user info
        const userParam = encodeURIComponent(JSON.stringify(response.data.user));
        navigate(`/verify-email?user=${userParam}&emailSent=${response.data.emailSent}`);
        return;
      }

      // For users who don't require email verification, we can log them in immediately
      navigate('/login');

      // Optionally, you could also log the user in immediately by storing the token and user data here
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };
  //block 2 end










//block 3
// Handle Google OAuth registration flow
  const handleGoogleRegister = () => {

    // Ensure Terms of Service is accepted before allowing Google registration
    localStorage.setItem('onboarding_pending', 'true');
    const frontendOrigin = encodeURIComponent(window.location.origin);
    window.location.href = `${API_BASE}/api/auth/google/register?frontend=${frontendOrigin}`;
  };
//block 3 end






  //main render
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
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('passwordRulesHint')}
          </p>

          <input
            className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'border-gray-300 text-gray-900'}`}
            type="password"
            placeholder={t('confirmPassword')}
            value={passwordConfirm}
            onChange={e => setPasswordConfirm(e.target.value)}
          />

          {/* Terms of Service gate */}
          <div className={`text-sm border rounded-xl p-3 ${isDark ? 'text-gray-300 bg-gray-800 border-gray-700' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
            <p className="mb-2">{t('readTerms')} <Link className="text-blue-600 underline" to="/terms">{t('termsOfService')}</Link>.</p>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
              <span>{t('acceptTerms')}</span>
              <span className={`ml-auto text-xs ${tosRead ? 'text-green-600' : 'text-red-500'}`}>{tosRead ? t('loading') : t('pleaseReadTerms')}</span>
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
              if (!tosRead) { alert(t('pleaseReadTermsFirst')); return; }
              if (!agree) { alert(t('pleaseAcceptTerms')); return; }
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
  //main render end 
}
