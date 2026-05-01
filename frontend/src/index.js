// This file is the entry point of the React application. 
// It sets up the root component and renders it to the DOM.


//importing necessary libraries and components
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// === Google OAuth Redirect Handler ===
function handleGoogleOAuthRedirect() {

  // Parse URL parameters to check for token and user info
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const user = params.get('user');





  // If we have a token, 
  // the user has just been redirected back from Google 
  // OAuth login
  if (token) {
    // Save JWT token
    localStorage.setItem('token', token);

    // Save user if provided (some backends send it)
    if (user) {
      try {
        localStorage.setItem('user', JSON.stringify(JSON.parse(user)));
      } catch {
        // If backend sent URL-encoded JSON string
        localStorage.setItem('user', user);
      }
    }

    // Remove token/user from URL
    window.history.replaceState({}, document.title, "/home");

    // Redirect
    window.location.href = "/home";
  }
}

// Run immediately
handleGoogleOAuthRedirect();



// Render the root component into the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);






// Register service worker for offline 
// support and PWA features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => console.log('SW registered:', registration.scope))
      .catch((err) => console.log('SW registration failed:', err));
  });
}




// Measure performance of the app (optional)
reportWebVitals();
