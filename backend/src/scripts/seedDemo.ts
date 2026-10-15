import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { ensureDefaultDemoData } from '../services/seed.service.js';
import { logger } from '../config/logger.js';

async function runSeed() {
  logger.info('Initializing Semimatrix seeded demo environment...');
  await connectDatabase();

  const { workspaceId, equipmentCount } = await ensureDefaultDemoData();

  logger.info({
    msg: 'Seeded demo generation complete!',
    workspaceId,
    equipmentCount,
    demoCredentials: [
      { email: 'demo@semimatrix.local', password: 'Semimatrix123!' },
      { email: 'engineer@semimatrix.local', password: 'Semimatrix123!' },
      { email: 'engineer@semimatrix.com', password: 'DemoPassword2026!' }
    ]
  });

  await disconnectDatabase();
}

runSeed().catch((err) => {
  console.error('Seed demo failed:', err);
  process.exit(1);
});
