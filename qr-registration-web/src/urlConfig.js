// Elite Fitness - Centralized Public URL & API Configuration
export const DEFAULT_PRODUCTION_FRONTEND_URL = 'https://vikasyadav00.github.io/Elite-Fitness';
export const DEFAULT_PRODUCTION_API_URL = 'https://elite-fitness-backend.onrender.com/api';

/**
 * Returns the base URL of the frontend deployment (e.g. https://vikasyadav00.github.io/Elite-Fitness)
 */
export function getFrontendBaseUrl() {
  if (typeof window !== 'undefined') {
    // 1. Saved frontend URL in local storage
    const saved = localStorage.getItem('ef_frontend_url');
    if (saved && !saved.includes('localhost') && !saved.includes('127.0.0.1')) {
      return saved
        .split('?')[0]
        .split('#')[0]
        .replace(/\/register\/?$/, '')
        .replace(/\/feedback\/?$/, '')
        .replace(/\/checkin\/?$/, '')
        .replace(/\/attendance\/?$/, '')
        .replace(/\/complaint\/?$/, '')
        .replace(/\/qr\/?$/, '')
        .replace(/\/+$/, '');
    }

    // 2. Running on GitHub Pages
    if (window.location.hostname.includes('github.io')) {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const repo = (pathParts.length > 0 && !['feedback', 'register', 'checkin', 'attendance', 'qr', 'complaint'].includes(pathParts[0]))
        ? `/${pathParts[0]}`
        : '/Elite-Fitness';
      return `${window.location.origin}${repo}`;
    }

    // 3. Custom production domain
    if (window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
      return window.location.origin;
    }
  }

  return (import.meta.env.VITE_FRONTEND_URL || DEFAULT_PRODUCTION_FRONTEND_URL).replace(/\/+$/, '');
}

/**
 * Universal QR URL - the ONE permanent public QR for the gym entrance
 * Always routes to /qr (the service selection landing page)
 */
export function getPublicUniversalQrUrl() {
  return `${getFrontendBaseUrl()}/qr`;
}

/**
 * Public Feedback URL
 */
export function getPublicFeedbackUrl() {
  return `${getFrontendBaseUrl()}/feedback`;
}

/**
 * Public Registration URL
 */
export function getPublicRegistrationUrl() {
  return `${getFrontendBaseUrl()}/register`;
}

/**
 * Public Attendance/Check-in URL
 */
export function getPublicAttendanceUrl() {
  return `${getFrontendBaseUrl()}/checkin`;
}

/**
 * Public Complaint & Support URL
 */
export function getPublicComplaintUrl() {
  return `${getFrontendBaseUrl()}/complaint`;
}

/**
 * Resolves the Backend API Base URL
 * NEVER returns relative '/api' on GitHub Pages!
 */
export function getApiBaseUrl() {
  // 1. Vite environment variable passed at build or dev time
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  if (typeof window !== 'undefined') {
    // 2. Query parameter (?api=https://...) - useful for live testing/switching backend
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('api');
    if (fromQuery) {
      try {
        localStorage.setItem('ef_backend_url', fromQuery);
      } catch (_) {}
      return fromQuery;
    }

    // 3. Stored backend URL from previous session
    const saved = localStorage.getItem('ef_backend_url');
    if (saved) return saved;

    // 4. Injected window configuration
    if (window.__ELITE_FITNESS_API_URL__) {
      return window.__ELITE_FITNESS_API_URL__;
    }

    // 5. Localhost development environment
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Private LAN IP in local testing
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
      return `http://${hostname}:5000/api`;
    }
  }

  // 6. Default centralized production backend API URL
  return DEFAULT_PRODUCTION_API_URL;
}
