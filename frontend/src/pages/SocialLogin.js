//social login callback page
// This page is used as the callback URL for social login providers like Google and Facebook.
// It extracts the token and user information from the URL parameters, 
// saves them to localStorage, and then redirects 
// the user to the home page or login page as appropriate.









//imports 
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
//imports end 








//social login component
export default function SocialLogin({ onLogin }) {

  // Get the current language and navigation function
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDark] = useState(localStorage.getItem('theme') === 'dark');





  


  //use effecr 1 
  // Effect to handle social login callback
  useEffect(() => {




    // Extract token and user info from URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');


    // If token is present, save it and redirect to home
    if (token) {


      // Save token and optionally save user info
      localStorage.setItem('token', token);
      if (userParam) localStorage.setItem('user', userParam);


      // Call onLogin callback if provided
      if (onLogin) onLogin();


      // Redirect to home or dashboard
      navigate('/home');

      // Optionally, you can show a success message or perform additional actions here
    } else {


      // If no token, redirect to login
      navigate('/login');
    }
  }, [navigate, onLogin]);
//use effect 1 end








  // Render a loading message while processing the login
  return <p className={`text-center mt-20 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`}>Logging you in...</p>;
} 
