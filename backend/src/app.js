// Elite Fitness Backend - Main App Configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const membershipPlanRoutes = require('./routes/membershipPlanRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const dietRoutes = require('./routes/dietRoutes');
const progressRoutes = require('./routes/progressRoutes');
const leadRoutes = require('./routes/leadRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const offerRoutes = require('./routes/offerRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRequestRoutes = require('./routes/paymentRequestRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration - Production & Development
const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.QR_WEB_URL,
  process.env.OWNER_APP_URL,
  'https://vikasyadav00.github.io',
  'https://vikasyadav00.github.io/Elite-Fitness',
  'https://elite-fitness-backend.onrender.com',
  'https://elite-fitness-api.loca.lt',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
].filter(Boolean);

// Parse comma-separated origins if provided
if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !configuredOrigins.includes(trimmed)) {
      configuredOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile native apps, Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Exact match in configured origins
    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow GitHub Pages deployment domains (*.github.io)
    if (/^https:\/\/[a-zA-Z0-9-]+\.github\.io$/.test(origin) || origin.endsWith('.github.io')) {
      return callback(null, true);
    }

    // Allow Cloud deployment domains (*.onrender.com, *.loca.lt)
    if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(origin) || /^https:\/\/[a-zA-Z0-9-]+\.loca\.lt$/.test(origin)) {
      return callback(null, true);
    }

    // Allow Capacitor, localhost, or private LAN IPs (192.168.x.x, 10.x.x.x, 172.x.x.x)
    if (
      origin.startsWith('capacitor://') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin)
    ) {
      return callback(null, true);
    }

    // In development mode, allow any origin
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    logger.warn(`Blocked by CORS: origin=${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Bypass-Tunnel-Reminder', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
// Handle preflight across all routes
app.options('*', cors(corsOptions));

// ─── Public Health Check & Service Info (Requirement 4) ──────────────────────
// Mounted BEFORE rate-limiting so health-checks never get throttled
const healthCheckHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    success: true,
    service: 'Elite Fitness API',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    database: require('./config/database').getActiveEngine()
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Elite Fitness API',
    environment: process.env.NODE_ENV || 'production',
    message: 'Elite Fitness Production Backend is operational',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      apiBase: '/api'
    }
  });
});

// Request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/membership-plans', membershipPlanRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payment-requests', paymentRequestRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);

// Not found & Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
