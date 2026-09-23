import axios from 'axios';

// Detect whether running inside Capacitor APK on mobile
export const isCapacitor = () => {
  return typeof window !== 'undefined' && (
    window.Capacitor !== undefined ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
  );
};

export const getApiBaseUrl = () => {
  const customUrl = localStorage.getItem('elite_fitness_api_url');
  if (customUrl) return customUrl;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // If in Android APK via Capacitor, default to host machine LAN IP
  if (isCapacitor()) {
    return 'http://192.168.1.49:5000/api';
  }
  // Otherwise browser default
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
