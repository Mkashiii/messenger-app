import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const instance = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return instance.post('/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (userData) => instance.post('/register', userData),
};

export const usersAPI = {
  getMe: () => instance.get('/users/me'),
  updateMe: (data) => instance.put('/users/me', data),
  updateStatus: (isOnline) => instance.put('/users/me/status', { is_online: isOnline }),
  getUsers: (search = '') => instance.get('/users', { params: { search } }),
  getUser: (userId) => instance.get(`/users/${userId}`),
};

export const messagesAPI = {
  getConversation: (userId) => instance.get(`/messages/${userId}`),
  sendMessage: (data) => instance.post('/messages', data),
  getGroupMessages: (groupId) => instance.get(`/messages/groups/${groupId}`),
  markAsRead: (messageId) => instance.put(`/messages/${messageId}/read`),
};

export const groupsAPI = {
  getGroups: () => instance.get('/groups'),
  createGroup: (data) => instance.post('/groups', data),
  getGroup: (groupId) => instance.get(`/groups/${groupId}`),
  updateGroup: (groupId, data) => instance.put(`/groups/${groupId}`, data),
  deleteGroup: (groupId) => instance.delete(`/groups/${groupId}`),
  addMember: (groupId, userId) => instance.post(`/groups/${groupId}/members`, { user_id: userId }),
  removeMember: (groupId, userId) => instance.delete(`/groups/${groupId}/members/${userId}`),
  getMembers: (groupId) => instance.get(`/groups/${groupId}/members`),
};

export default instance;
