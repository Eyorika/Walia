import 'dotenv/config';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT ?? 4000;

async function start() {
  const app = await createApp();

  const server = app.listen(PORT, () => {
    logger.info(`🚀 WaliaBet API running on port ${PORT}`);
    logger.info(`📚 Docs: http://localhost:${PORT}/docs`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

start();
