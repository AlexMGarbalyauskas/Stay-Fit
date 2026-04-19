import axios from 'axios';

const isBrowser = typeof window !== 'undefined';
const DEFAULT_PROD_API_BASE = 'https://stay-fit-1.onrender.com';

const resolveApiBase = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (isBrowser) {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
  }

  return DEFAULT_PROD_API_BASE;
};

export const API_BASE = resolveApiBase();

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

export const verifyEmailToken = (token, userId) =>
  api.post('/api/auth/verify-email-token', { token, userId });

export const verifyEmailCode = (code, userId) =>
  api.post('/api/auth/verify-email-code', { code, userId });

export const resendVerificationCode = (userId) =>
  api.post('/api/auth/resend-verification-code', { userId });

export const verifyEmail = () => api.post('/api/auth/verify-email');

export const getVerificationStatus = () => api.get('/api/auth/verification-status');

// USERS
export const getUsers = () => api.get('/api/users');
export const getUser = id => api.get(`/api/users/${id}`);
export const getMe = () => api.get('/api/me');
export const updateMe = (data) => api.put('/api/me', data);
export const changePassword = (currentPassword, newPassword) =>
  api.put('/api/me/password', { currentPassword, newPassword });
export const getTotalUsersCount = async () => {
  const res = await api.get('/api/users');
  return res.data.users?.length || 0;
};

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
export const deleteNotification = (id) => api.delete(`/api/notifications/${id}`);

// WORKOUT SCHEDULES
export const respondToWorkoutInvite = (participantId, status) =>
  api.post(`/api/workout-schedules/invites/${participantId}/respond`, { status });

// POSTS
export const getPosts = () => api.get('/api/posts');
export const getPost = (postId) => api.get(`/api/posts/${postId}`);
export const getMyPosts = () => api.get('/api/posts/me');
export const getSavedPosts = () => api.get('/api/posts/saved');
export const getUserPosts = (userId) => api.get(`/api/posts/user/${userId}`);
export const createPost = (formData) => api.post('/api/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updatePost = (postId, data) => api.put(`/api/posts/${postId}`, data);
export const deletePost = (postId) => api.delete(`/api/posts/${postId}`);
export const exportMyPosts = () => api.get('/api/posts/mine/export');
export const likePost = (postId) => api.post(`/api/posts/${postId}/like`);
export const unlikePost = (postId) => api.delete(`/api/posts/${postId}/like`);
export const savePost = (postId) => api.post(`/api/posts/${postId}/save`);
export const unsavePost = (postId) => api.delete(`/api/posts/${postId}/save`);
export const toggleLike = (postId) => api.post(`/api/posts/${postId}/like`);
export const toggleSave = (postId) => api.post(`/api/posts/${postId}/save`);

// COMMENTS
export const getComments = (postId) => api.get(`/api/posts/${postId}/comments`);
export const createComment = (postId, content, parentCommentId = null) =>
  api.post(`/api/posts/${postId}/comments`, {
    content,
    parent_comment_id: parentCommentId,
  });
export const deleteComment = (postId, commentId) => api.delete(`/api/posts/${postId}/comments/${commentId}`);
export const likeComment = (postId, commentId) => api.post(`/api/posts/${postId}/comments/${commentId}/like`);
export const unlikeComment = (postId, commentId) => api.delete(`/api/posts/${postId}/comments/${commentId}/like`);
export const toggleCommentLike = (postId, commentId) => api.post(`/api/posts/${postId}/comments/${commentId}/like`);

// NESTED COMMENTS
export const getNestedComments = (postId, commentId) => api.get(`/api/posts/${postId}/comments/${commentId}/replies`);
export const createNestedComment = (postId, commentId, content) =>
  api.post(`/api/posts/${postId}/comments/${commentId}/replies`, { content });
export const deleteNestedComment = (postId, commentId, nestedCommentId) =>
  api.delete(`/api/posts/${postId}/comments/${commentId}/replies/${nestedCommentId}`);
export const likeNestedComment = (postId, commentId, nestedCommentId) =>
  api.post(`/api/posts/${postId}/comments/${commentId}/replies/${nestedCommentId}/like`);
export const unlikeNestedComment = (postId, commentId, nestedCommentId) =>
  api.delete(`/api/posts/${postId}/comments/${commentId}/replies/${nestedCommentId}/like`);

// AI HELPER
export const askAIHelper = (prompt, language = 'en') => api.post('/api/ai/helper', { prompt, language });

// ACCOUNT
export const deleteAccount = (password) => api.delete('/api/me/delete', { data: { password } });

export default api;
