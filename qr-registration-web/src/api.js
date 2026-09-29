import axios from 'axios';
import { getApiBaseUrl } from './urlConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10s timeout for mobile networks & cloud backends
});

// Dynamically resolve baseURL on each request in case URL was updated in session
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Standardize error responses for production-safe UI messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'An unexpected error occurred. Please try again.';

    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        friendlyMessage = 'Server took too long to respond. Please check your connection and try again.';
      } else {
        friendlyMessage = 'Unable to connect to server. Please check your internet connection.';
      }
    } else {
      const data = error.response.data;
      if (data && typeof data === 'object') {
        friendlyMessage = data.message || data.error || friendlyMessage;
      } else if (error.response.status === 404) {
        friendlyMessage = 'The requested service endpoint was not found on the server.';
      } else if (error.response.status === 500) {
        friendlyMessage = 'Server error. Please try again in a few moments.';
      }
    }

    // Attach user-friendly message
    error.userMessage = friendlyMessage;
    return Promise.reject(error);
  }
);

export default api;
