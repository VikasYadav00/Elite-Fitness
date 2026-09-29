// Elite Fitness - Centralized Public URL & QR Configuration for Owner App
export const DEFAULT_PRODUCTION_FRONTEND_URL = 'https://vikasyadav00.github.io/Elite-Fitness';
export const DEFAULT_PRODUCTION_API_URL = 'https://elite-fitness-backend.onrender.com/api';

/**
 * Returns the base URL of the deployed QR web portal
 */
export function getFrontendBaseUrl() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('ef_frontend_url') || localStorage.getItem('ef_registration_url');
    if (saved && !saved.includes('localhost') && !saved.includes('127.0.0.1') && !saved.includes('192.168.')) {
      // If it ends with /register or trailing slash, strip it for the base
      return saved.replace(/\/register\/?$/, '').replace(/\/feedback\/?$/, '').replace(/\/+$/, '');
    }
  }
  return (import.meta.env.VITE_FRONTEND_URL || DEFAULT_PRODUCTION_FRONTEND_URL).replace(/\/+$/, '');
}

/**
 * Universal QR URL — the ONE permanent public QR for the gym entrance
 * Points to /qr (service selection landing page)
 */
export function getPublicUniversalQrUrl() {
  const custom = localStorage.getItem('ef_universal_qr_url');
  if (custom && !custom.includes('localhost') && !custom.includes('127.0.0.1') && !custom.includes('192.168.')) {
    return custom;
  }
  return `${getFrontendBaseUrl()}/qr`;
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
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('elite_fitness_api_url');
    if (custom) return custom;
  }

  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // In local development on browser
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // In Capacitor mobile Android APK, if not customized, connect to host machine or production
    if (window.Capacitor !== undefined || window.location.protocol === 'capacitor:') {
      return 'http://192.168.1.49:5000/api';
    }
  }

  return DEFAULT_PRODUCTION_API_URL;
}
