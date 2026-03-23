import express from 'express';
import processRoutes from './routes/processes.js';

/** App with JSON + `/api` only; static files added in `server/index.js`. */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', processRoutes);
  return app;
}
