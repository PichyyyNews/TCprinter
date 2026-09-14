import express from 'express';
import cors from 'cors';
import { env } from './config/env.config';
import rootRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';

export function createApp(): express.Application {
  const app = express();

  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API endpoints
  app.use('/api/v1', rootRouter);

  // Global health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'TCprinter Backend', time: new Date().toISOString() });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
