import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createApp } from './createApp.js';
import { connect as connectMongo } from './services/db/mongoClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const PORT = process.env.PORT || 3001;

const app = createApp();

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.use(express.static(PUBLIC));
}

async function start() {
  if (process.env.DATA_BACKEND === 'mongodb') {
    await connectMongo();
    console.log('MongoDB connected');
  }
  app.listen(PORT, () => {
    console.log(`Process Editor API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
