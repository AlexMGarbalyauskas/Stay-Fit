import axios from 'axios';

// Use environment variable if set, otherwise fallback to localhost for local testing
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const register = (username, email, password) =>
  axios.post(`${API_BASE}/register`, { username, email, password });

export const login = (email, password) =>
  axios.post(`${API_BASE}/login`, { email, password });

export const getMe = (token) =>
  axios.get(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
