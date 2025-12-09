import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// === Google OAuth Redirect Handler ===
function handleGoogleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);

  const token = params.get('token');
  const user = params.get('user');

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
