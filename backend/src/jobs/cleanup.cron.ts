import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.config';
import { logger } from '../lib/logger';

export function startCleanupCron() {
  // Run once every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Running temporary file cleanup cron...');
    const uploadDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(uploadDir)) return;

    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAgeMs = 60 * 60 * 1000; // 1 hour

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up stale temp file: ${file}`);
        }
      } catch (err) {
        logger.error(`Error inspecting/deleting file ${file}:`, err);
      }
    }
  });
}
