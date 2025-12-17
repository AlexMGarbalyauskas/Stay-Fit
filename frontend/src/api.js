import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const authHeader = () => ({
  headers: { 
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
});

export const register = (username, email, password) =>
  axios.post(`${API_BASE}/register`, { username, email, password });

export const login = (email, password) =>
  axios.post(`${API_BASE}/login`, { email, password });

export const getUsers = () => axios.get(`${API_BASE}/users`, authHeader());
export const getUser = (id) => axios.get(`${API_BASE}/users/${id}`, authHeader());
export const getMe = () => axios.get(`${API_BASE}/me`, authHeader());

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
