import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected) return true;

  if (!env.MONGODB_URI) {
    logger.info('No MONGODB_URI configured. Running in high-performance in-memory repository mode.');
    isConnected = true;
    return true;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    logger.info('Connected to MongoDB successfully.');
    return true;
  } catch (err) {
    logger.warn({
      msg: 'Could not connect to external MongoDB. Falling back to in-memory repository mode.',
      err: (err as Error).message
    });
    isConnected = true; // Fallback active
    return true;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  isConnected = false;
}

export function isDbConnected(): boolean {
  return isConnected;
}
