import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '..', '.env'),
];

const detectedEnvPath = envPaths.find((candidate) => fs.existsSync(candidate));
dotenv.config(detectedEnvPath ? { path: detectedEnvPath } : undefined);

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  ADMIN_JWT_SECRET: z.string().min(16),
  ADMIN_JWT_EXPIRY: z.string().default('8h'),
  ADMIN_ALLOWED_IPS: z.string().default('127.0.0.1,::1'),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_ENDPOINT: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().min(1),
  FLUTTERWAVE_PUBLIC_KEY: z.string().min(1),
  FLUTTERWAVE_SECRET_HASH: z.string().min(1),
  AT_API_KEY: z.string().min(1),
  AT_USERNAME: z.string().min(1),
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM_EMAIL: z.string().email(),
  SENDGRID_FROM_NAME: z.string().min(1),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_URL: z.string().url().default('http://localhost:3001'),
  SOCKET_CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  PLATFORM_COMMISSION_RATE: z.coerce.number().default(0.15),
  PROVIDER_SUBSCRIPTION_FEE: z.coerce.number().default(150),
  MIN_CATALOGUE_IMAGES: z.coerce.number().default(3),
  MIN_IMAGE_WIDTH_PX: z.coerce.number().default(1080),
  MIN_IMAGE_HEIGHT_PX: z.coerce.number().default(1080),
  LOGIN_LOCK_THRESHOLD: z.coerce.number().default(5),
  LOGIN_LOCK_WINDOW_SEC: z.coerce.number().default(900),
  LOGIN_LOCKOUT_SEC: z.coerce.number().default(900),
  ADMIN_LOGIN_LOCK_THRESHOLD: z.coerce.number().default(5),
  ADMIN_LOGIN_LOCK_WINDOW_SEC: z.coerce.number().default(900),
  ADMIN_LOGIN_LOCKOUT_SEC: z.coerce.number().default(900),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
});

export const env = schema.parse(process.env);
