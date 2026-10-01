// Elite Fitness Management System - Entry Point
require('dotenv').config();
require('express-async-errors');

const app = require('./src/app');
const { testConnection, getActiveEngine } = require('./src/config/database');
const { runMigrations } = require('./src/config/migrate');
const logger = require('./src/utils/logger');

const { initCronJobs } = require('./src/services/cronService');
const { initCloudSyncService } = require('./src/services/cloudSyncService');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

async function startServer() {
  try {
    // Test database connection
    try {
      await testConnection();
      logger.info('✅ Database connection established');
      if (getActiveEngine() === 'pg') {
        await runMigrations();
        logger.info('✅ PostgreSQL database migrations completed');
      } else {
        logger.info('✅ Persistent SQLite database initialized');
      }
    } catch (dbErr) {
      logger.warn('⚠️ Database connection note: Could not connect to PostgreSQL. Running in preview mode.', dbErr.message);
    }

    // Initialize cron jobs
    initCronJobs();

    // Initialize cloud sync service for worldwide GitHub Pages QR events
    initCloudSyncService();

    // Start server (bound to 0.0.0.0 for cloud hosting compatibility)
    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Elite Fitness Backend running on http://${HOST}:${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'production'}`);
      logger.info(`🔗 Public Health Check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
  }
}

startServer();
