import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SocialLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Save token and optionally fetch user info
      localStorage.setItem('token', token);
      // Redirect to home or dashboard
      navigate('/home');
    } else {
      // If no token, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  return <p className="text-center mt-20 text-gray-500">Logging you in...</p>;
}
