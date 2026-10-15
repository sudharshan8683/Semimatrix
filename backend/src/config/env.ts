import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().optional().default(''),
  JWT_ACCESS_SECRET: z.string().min(16).default('semimatrix_super_secret_access_key_change_in_production_2026'),
  JWT_REFRESH_SECRET: z.string().min(16).default('semimatrix_super_secret_refresh_key_change_in_production_2026'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ML_SERVICE_URL: z.string().default('http://localhost:8000'),
  DATASET_UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(25),
  MAX_UPLOAD_ROWS: z.coerce.number().default(100000),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
