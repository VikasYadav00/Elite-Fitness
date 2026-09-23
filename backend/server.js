// Elite Fitness Management System - Entry Point
require('dotenv').config();
require('express-async-errors');

const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const { runMigrations } = require('./src/config/migrate');
const logger = require('./src/utils/logger');

const { initCronJobs } = require('./src/services/cronService');
const { initCloudSyncService } = require('./src/services/cloudSyncService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    try {
      await testConnection();
      logger.info('✅ Database connection established');
      await runMigrations();
      logger.info('✅ Database migrations completed');
    } catch (dbErr) {
      logger.warn('⚠️ Database connection note: Could not connect to PostgreSQL. Running in preview mode.', dbErr.message);
    }

    // Initialize cron jobs & cloud sync service
    initCronJobs();
    initCloudSyncService();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Elite Fitness Backend running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
  }
}

startServer();
