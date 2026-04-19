import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fsds_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fsds_token');
      localStorage.removeItem('fsds_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
