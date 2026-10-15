import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'token',
      'accessToken',
      'refreshToken',
      'password',
      'passwordHash',
      'email',
      '*.email',
      'body.email',
      'body.password',
      'rawData',
      'sensorRows[*]'
    ],
    censor: '[REDACTED]'
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard'
    }
  } : undefined
});
