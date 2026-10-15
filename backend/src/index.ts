import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './db/connection.js';
import { ensureDefaultDemoData } from './services/seed.service.js';

async function bootstrap() {
  await connectDatabase();
  await ensureDefaultDemoData();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Semimatrix API server listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = () => {
    logger.info('Gracefully shutting down Semimatrix server...');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.fatal({ err: err.message }, 'Failed to start Semimatrix server');
  process.exit(1);
});
