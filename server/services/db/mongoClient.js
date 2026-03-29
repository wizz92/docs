import mongoose from 'mongoose';

/**
 * Connect to MongoDB via Mongoose. Idempotent; safe to call multiple times.
 * Requires process.env.MONGODB_URI.
 * @returns {Promise<typeof mongoose>}
 */
export async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }
  await mongoose.connect(uri);
  return mongoose;
}

export async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export { ProcessDocument } from './models/ProcessDocument.js';
export { Dictionary } from './models/Dictionary.js';
export { MasterIndex } from './models/MasterIndex.js';
