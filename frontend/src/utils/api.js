import axios from 'axios';

// Always point frontend to the hosted backend for API calls.
const HOSTED_API_BASE = 'https://readar-monorepo.onrender.com/api';

export const api = axios.create({
  baseURL: HOSTED_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
