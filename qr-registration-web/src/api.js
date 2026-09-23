import axios from 'axios';

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ef_backend_url');
    if (saved) return saved;
    const hostname = window.location.hostname;
    // When running hosted on GitHub Pages or external domain without custom backend
    if (hostname.includes('github.io') || window.location.protocol === 'https:') {
      return '/api'; // Relative endpoint or mocked
    }
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
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
  timeout: 4000,
});

export default api;
