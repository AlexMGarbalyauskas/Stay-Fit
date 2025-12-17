import axios from 'axios';

// Set API base depending on environment
const API_BASE = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL  // production URL from env
  : 'http://localhost:4000/api';   // local development

// Helper to attach auth header
const authHeader = () => ({
  headers: { 
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
});

// ---------- AUTH ----------
export const register = (username, email, password) =>
  axios.post(`${API_BASE}/register`, { username, email, password });

export const login = (email, password) =>
  axios.post(`${API_BASE}/login`, { email, password });

// ---------- USERS ----------
export const getUsers = () => axios.get(`${API_BASE}/users`, authHeader());
export const getUser = (id) => axios.get(`${API_BASE}/users/${id}`, authHeader());
export const getMe = () => axios.get(`${API_BASE}/me`, authHeader());

// ---------- FRIEND REQUESTS ----------
export const sendFriendRequest = (receiverId) =>
  axios.post(`${API_BASE}/friends/request`, { receiverId }, authHeader());

export const getFriendStatus = (userId) =>
  axios.get(`${API_BASE}/friends/status/${userId}`, authHeader());

export const getFriends = () =>
  axios.get(`${API_BASE}/friends`, authHeader());

export const unfriend = (friendId) =>
  axios.post(`${API_BASE}/friends/unfriend`, { friendId }, authHeader());

export const getFriendRequests = () =>
  axios.get(`${API_BASE}/friends/requests`, authHeader());

export const acceptFriendRequest = (requestId, senderId) =>
  axios.post(`${API_BASE}/friends/accept`, { requestId, senderId }, authHeader());

export const rejectFriendRequest = (requestId) =>
  axios.post(`${API_BASE}/friends/reject`, { requestId }, authHeader());
