import axios from 'axios';

const API_BASE = 'https://stay-fit-1.onrender.com/api';

export const register = (username, email, password) => 
  axios.post(`${API_BASE}/register`, { username, email, password });

export const login = (email, password) =>
  axios.post(`${API_BASE}/login`, { email, password });

export const getMe = (token) =>
  axios.get(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
