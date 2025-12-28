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
export const getMessageReactions = messageId => api.get(`/api/messages/${messageId}/reactions`);
export const toggleMessageReaction = (messageId, emoji) => api.post(`/api/messages/${messageId}/reactions`, { emoji });
export const deleteMessage = messageId => api.delete(`/api/messages/${messageId}`);

// NOTIFICATIONS
export const getNotifications = (type) => api.get(`/api/notifications${type ? `?type=${type}` : ''}`);
export const markNotificationRead = (id) => api.post('/api/notifications/mark-read', { id });
export const markAllNotificationsRead = () => api.post('/api/notifications/mark-all-read');

// POSTS
export const getPosts = () => api.get('/api/posts');
export const getMyPosts = () => api.get('/api/posts/me');
export const getUserPosts = (userId) => api.get(`/api/posts/user/${userId}`);
export const createPost = (formData) => api.post('/api/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updatePost = (postId, data) => api.put(`/api/posts/${postId}`, data);
export const deletePost = (postId) => api.delete(`/api/posts/${postId}`);

// LIKES & SAVES
export const getPostLikes = (postId) => api.get(`/api/posts/${postId}/likes`);
export const toggleLike = (postId) => api.post(`/api/posts/${postId}/like`);
export const getPostSaves = (postId) => api.get(`/api/posts/${postId}/saves`);
export const toggleSave = (postId) => api.post(`/api/posts/${postId}/save`);

// COMMENTS
export const getComments = (postId) => api.get(`/api/posts/${postId}/comments`);
export const createComment = (postId, content) => api.post(`/api/posts/${postId}/comments`, { content });
export const getPost = (postId) => api.get(`/api/posts/${postId}`);
export const getSavedPosts = () => api.get('/api/posts/saved');

export default api;
