import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('reusecircle_token') : null;
if (initialToken && api.defaults?.headers?.common) {
  api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('reusecircle_token') : null;
  if (token) {
    config.headers = config.headers || {};
    if (typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

api.interceptors.response.use((r) => r, (error) => {
  if (axios.isCancel(error)) return Promise.reject(error);
  const message = new Error(error.response?.data?.message || 'Unable to reach ReUseCircle. Please try again.');
  message.status = error.response?.status;
  return Promise.reject(message);
});

export default api;
