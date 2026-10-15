import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './errors/errorHandler.js';
import { AppError } from './errors/AppError.js';
import { authRouter } from './routes/auth.routes.js';
import { datasetRouter } from './routes/dataset.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { equipmentRouter } from './routes/equipment.routes.js';
import { lotRouter } from './routes/lot.routes.js';
import { mlRouter } from './routes/ml.routes.js';
import { alertRouter } from './routes/alert.routes.js';
import { investigationRouter } from './routes/investigation.routes.js';
import { reportRouter } from './routes/report.routes.js';

export function createApp() {
  const app = express();

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS Allow-list
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new AppError(403, 'FORBIDDEN', `CORS origin ${origin} not permitted`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    })
  );

  // 3. Request Parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // 4. Sanitize against NoSQL injection
  app.use(mongoSanitize());

  // 5. Structured HTTP Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === '/health'
        }
      })
    );
  }

  // 6. System Health Check
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'Semimatrix',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV
    });
  });

  // 7. Mount Routers (Support both /api/v1 and /api for seamless proxying)
  const mountRoutes = (prefix: string) => {
    app.use(`${prefix}/auth`, authRouter);
    app.use(`${prefix}/datasets`, datasetRouter);
    app.use(`${prefix}/dashboard`, dashboardRouter);
    app.use(`${prefix}/equipment`, equipmentRouter);
    app.use(`${prefix}/lots`, lotRouter);
    app.use(`${prefix}/ml`, mlRouter);
    app.use(`${prefix}/alerts`, alertRouter);
    app.use(`${prefix}/investigations`, investigationRouter);
    app.use(`${prefix}/reports`, reportRouter);
  };

  mountRoutes('/api/v1');
  mountRoutes('/api');

  // 8. Catch 404 Route Not Found
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(404, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`));
  });

  // 9. Central Error Handler
  app.use(errorHandler);

  return app;
}
