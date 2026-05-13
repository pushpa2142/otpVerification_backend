/**
 * Server Entry Point
 * Bootstraps the Express app and connects to MongoDB
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/database');
const logger = require('./utils/logger');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const PORT = parseInt(process.env.PORT, 10) || 3000;

/**
 * Start the server after establishing database connection
 */
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // ── Graceful Shutdown ──────────────────────────────────────────────────

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDB();
        process.exit(0);
      });

      // Force exit after 10s if connections hang
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection guard
    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled Promise Rejection: ${reason}`);
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
