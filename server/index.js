import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import processRoutes from './routes/processes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use('/api', processRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.use(express.static(PUBLIC));
}

app.listen(PORT, () => {
  console.log(`Process Editor API running on http://localhost:${PORT}`);
});
