import http from 'http';
import { createApp } from './app';
import { initSocketServer } from './sockets';
import { startCleanupCron } from './jobs/cleanup.cron';
import { startTimeoutCron } from './jobs/timeout.cron';
import { env } from './config/env.config';
import { logger } from './lib/logger';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize WebSockets
  initSocketServer(server);

  // Start background cron jobs
  startCleanupCron();
  startTimeoutCron();

  server.listen(env.PORT, () => {
    logger.info(`=========================================`);
    logger.info(`🚀 TCprinter Backend Engine started`);
    logger.info(`🌐 HTTP Server listening on port ${env.PORT}`);
    logger.info(`📡 WebSocket Server attached`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`=========================================`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrapping error:', err);
  process.exit(1);
});
