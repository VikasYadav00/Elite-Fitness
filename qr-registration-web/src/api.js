import axios from 'axios';

// Extract backend URL from QR code query parameters (?api=http://192.168.1.49:5000/api)
// This is the key technique: the owner embeds their local backend URL into the QR code,
// so when members scan on gym Wi-Fi their phone can hit the local backend directly.
function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // 1. From QR code: ?api=<backend_url>  (highest priority)
    const params = new URLSearchParams(window.location.search);
    const fromQr = params.get('api');
    if (fromQr) {
      try {
        localStorage.setItem('ef_qr_backend_url', fromQr);
      } catch (_) {}
      return fromQr;
    }

    // 2. Previously captured from QR (persisted so it survives navigation/refresh)
    const persisted = localStorage.getItem('ef_qr_backend_url');
    if (persisted) return persisted;

    // 3. VITE_API_URL env override
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 4. Same-host backend (for local dev server)
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && !hostname.includes('github.io')) {
      return `http://${hostname}:5000/api`;
    }
  }
  return 'http://localhost:5000/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Re-resolve baseURL on each request in case it was just captured from the URL
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

export default api;
