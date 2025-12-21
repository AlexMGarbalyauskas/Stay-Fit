import axios from 'axios';

export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AUTH
export const register = (username, email, password) =>
  api.post('/api/auth/register', { username, email, password });

export const login = (login, password) =>
  api.post('/api/auth/login', { login, password });

// USERS
export const getUsers = () => api.get('/api/users');
export const getUser = id => api.get(`/api/users/${id}`);
export const getMe = () => api.get('/api/me');

// FRIENDS
export const sendFriendRequest = receiverId => api.post('/api/friends/request', { receiverId });
export const getFriendStatus = userId => api.get(`/api/friends/status/${userId}`);
export const getFriends = () => api.get('/api/friends');
export const unfriend = friendId => api.post('/api/friends/unfriend', { friendId });
export const getFriendRequests = () => api.get('/api/friends/requests');
export const acceptFriendRequest = (requestId, senderId) =>
  api.post('/api/friends/accept', { requestId, senderId });
export const rejectFriendRequest = requestId => api.post('/api/friends/reject', { requestId });

// MESSAGES
export const getMessages = userId => api.get(`/api/messages/${userId}`);

export default api;
