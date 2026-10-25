import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import requirementRoutes from './routes/requirementRoutes';
import { errorHandler, notFound } from './middleware/errors';
import { requestLogger } from './middleware/requestLogger';

export function createApp() {
  const app = express();
  const allowedOrigin = process.env.CLIENT_URL ?? 'http://localhost:3000';
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    }),
  );
  app.use(requestLogger);
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) =>
    res.json({ success: true, data: { status: 'ok' } }),
  );
  app.use('/api/requirements', requirementRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
