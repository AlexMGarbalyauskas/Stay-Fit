import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function SocialLogin({ onLogin }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');

    if (token) {
      // Save token and optionally save user info
      localStorage.setItem('token', token);
      if (userParam) localStorage.setItem('user', userParam);
      if (onLogin) onLogin();
      // Redirect to home or dashboard
      navigate('/home');
    } else {
      // If no token, redirect to login
      navigate('/login');
    }
  }, [navigate, onLogin]);

  return <p className={`text-center mt-20 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`}>Logging you in...</p>;
} 
