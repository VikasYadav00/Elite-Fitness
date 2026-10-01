// Elite Fitness - Centralized Public URL & QR Configuration for Owner App
export const DEFAULT_PRODUCTION_FRONTEND_URL = 'https://vikasyadav00.github.io/Elite-Fitness';
export const DEFAULT_PRODUCTION_API_URL = 'https://count-cotton-firmware-castle.trycloudflare.com/api';
export const RENDER_BACKEND_API_URL = 'https://elite-fitness-backend.onrender.com/api';

/**
 * Returns the clean base URL of the deployed QR web portal
 */
export function getFrontendBaseUrl() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ef_frontend_url');
    if (saved && !saved.includes('localhost') && !saved.includes('127.0.0.1') && !saved.includes('192.168.')) {
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
  }
  return (import.meta.env.VITE_FRONTEND_URL || DEFAULT_PRODUCTION_FRONTEND_URL)
    .split('?')[0]
    .split('#')[0]
    .replace(/\/register\/?$/, '')
    .replace(/\/feedback\/?$/, '')
    .replace(/\/checkin\/?$/, '')
    .replace(/\/qr\/?$/, '')
    .replace(/\/+$/, '');
}

/**
 * Universal QR URL — the ONE permanent public QR for the gym entrance
 * Always points strictly to /qr (service selection landing page)
 */
export function getPublicUniversalQrUrl() {
  const base = getFrontendBaseUrl();
  const custom = localStorage.getItem('ef_universal_qr_url');
  if (custom && !custom.includes('localhost') && !custom.includes('127.0.0.1') && !custom.includes('192.168.')) {
    // Sanitize in case it was stored with /register or query parameters
    const clean = custom
      .split('?')[0]
      .split('#')[0]
      .replace(/\/register\/?$/, '')
      .replace(/\/feedback\/?$/, '')
      .replace(/\/checkin\/?$/, '')
      .replace(/\/attendance\/?$/, '')
      .replace(/\/complaint\/?$/, '')
      .replace(/\/+$/, '');
    return clean.endsWith('/qr') ? clean : `${clean}/qr`;
  }
  return `${base}/qr`;
}

/**
 * Public Feedback URL encoded into Reception / Wall QR Standee
 */
export function getPublicFeedbackUrl() {
  const custom = localStorage.getItem('ef_feedback_qr_url');
  if (custom && !custom.includes('localhost') && !custom.includes('127.0.0.1') && !custom.includes('192.168.')) {
    return custom;
  }
  return `${getFrontendBaseUrl()}/feedback`;
}

/**
 * Public Registration URL encoded into Reception Standee
 */
export function getPublicRegistrationUrl() {
  const custom = localStorage.getItem('ef_registration_url');
  if (custom && !custom.includes('localhost') && !custom.includes('127.0.0.1') && !custom.includes('192.168.')) {
    return custom;
  }
  return `${getFrontendBaseUrl()}/register`;
}

/**
 * Public Table Attendance URL encoded into Gym Table Stands
 */
export function getPublicAttendanceUrl() {
  const custom = localStorage.getItem('ef_attendance_url');
  if (custom && !custom.includes('localhost') && !custom.includes('127.0.0.1') && !custom.includes('192.168.')) {
    return custom;
  }
  return `${getFrontendBaseUrl()}/checkin`;
}

/**
 * Production Backend API URL
 * In production and mobile APK, strictly connects to the live HTTPS backend server
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('elite_fitness_api_url');
    if (custom) return custom.replace(/\/+$/, '');
  }

  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  if (typeof window !== 'undefined') {
    // In Capacitor mobile Android APK, always connect to live production HTTPS backend
    if (window.Capacitor !== undefined || window.location.protocol === 'capacitor:') {
      return DEFAULT_PRODUCTION_API_URL;
    }

    const hostname = window.location.hostname;
    // In local development on browser ONLY during active Vite dev
    if (import.meta.env.DEV && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      // If dev user has explicitly chosen local or if local backend is preferred in dev
      const devPreference = localStorage.getItem('ef_dev_prefer_local');
      if (devPreference === 'true') {
        return 'http://localhost:5000/api';
      }
      return DEFAULT_PRODUCTION_API_URL;
    }
  }

  return DEFAULT_PRODUCTION_API_URL;
}
