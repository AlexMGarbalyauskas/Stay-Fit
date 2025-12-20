import axios from 'axios';

// Base URL WITHOUT /api to prevent doubling
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Auth header
const authHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

// ---------- AUTH ----------
export const register = (username, email, password) =>
  axios.post(`${API_BASE}/api/register`, { username, email, password });

export const login = (email, password) =>
  axios.post(`${API_BASE}/api/login`, { email, password });

// ---------- USERS ----------
export const getUsers = () => axios.get(`${API_BASE}/api/users`, authHeader());
export const getUser = (id) => axios.get(`${API_BASE}/api/users/${id}`, authHeader());
export const getMe = () => axios.get(`${API_BASE}/api/me`, authHeader());

// ---------- FRIEND REQUESTS ----------
export const sendFriendRequest = (receiverId) =>
  axios.post(`${API_BASE}/api/friends/request`, { receiverId }, authHeader());

export const getFriendStatus = (userId) =>
  axios.get(`${API_BASE}/api/friends/status/${userId}`, authHeader());

export const getFriends = () =>
  axios.get(`${API_BASE}/api/friends`, authHeader());

export const unfriend = (friendId) =>
  axios.post(`${API_BASE}/api/friends/unfriend`, { friendId }, authHeader());

export const getFriendRequests = () =>
  axios.get(`${API_BASE}/api/friends/requests`, authHeader());

export const acceptFriendRequest = (requestId, senderId) =>
  axios.post(`${API_BASE}/api/friends/accept`, { requestId, senderId }, authHeader());

export const rejectFriendRequest = (requestId) =>
  axios.post(`${API_BASE}/api/friends/reject`, { requestId }, authHeader());
