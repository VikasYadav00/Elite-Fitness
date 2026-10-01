import axios from 'axios';

// Detect whether running inside Capacitor APK on mobile
export const isCapacitor = () => {
  return typeof window !== 'undefined' && (
    window.Capacitor !== undefined ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
  );
};

export const DEFAULT_PRODUCTION_API_URL = 'https://elite-fitness-backend.onrender.com/api';

export const getApiBaseUrl = () => {
  const customUrl = localStorage.getItem('elite_fitness_api_url');
  if (customUrl) return customUrl.replace(/\/+$/, '');
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  // If running in local Vite development on desktop browser only
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const devPreference = localStorage.getItem('ef_dev_prefer_local');
      if (devPreference === 'true') {
        return 'http://localhost:5000/api';
      }
    }
  }

  // Production default for APK on mobile data (4G/5G) and Web worldwide
  return DEFAULT_PRODUCTION_API_URL;
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
