import axios from 'axios';
import { getApiBaseUrl } from './urlConfig';

// Detect whether running inside Capacitor APK on mobile
export const isCapacitor = () => {
  return typeof window !== 'undefined' && (
    window.Capacitor !== undefined ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
  );
};

export { getApiBaseUrl };

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = sessionStorage.getItem('owner_token') || localStorage.getItem('owner_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'Unable to complete request. Please try again.';
    if (!error.response) {
      friendlyMessage = 'Cannot connect to backend server. Please verify backend is running.';
    } else if (error.response.data && error.response.data.message) {
      friendlyMessage = error.response.data.message;
    }
    error.userMessage = friendlyMessage;
    return Promise.reject(error);
  }
);

export default api;
