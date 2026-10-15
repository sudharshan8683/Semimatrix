import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { workspaceRepository } from '../repositories/workspace.repository.js';
import { equipmentRepository } from '../repositories/equipment.repository.js';
import { syntheticGeneratorService } from './syntheticGenerator.service.js';
import { logger } from '../config/logger.js';
import fs from 'fs';
import path from 'path';

export async function ensureDefaultDemoData(): Promise<{
  workspaceId: string;
  equipmentCount: number;
}> {
  const defaultUsers = [
    {
      email: 'demo@semimatrix.local',
      password: 'Semimatrix123!',
      fullName: 'Demo Operator',
      role: 'owner' as const
    },
    {
      email: 'engineer@semimatrix.local',
      password: 'Semimatrix123!',
      fullName: 'Lead Process Engineer',
      role: 'owner' as const
    },
    {
      email: 'engineer@semimatrix.com',
      password: 'DemoPassword2026!',
      fullName: 'Fab Process Engineer',
      role: 'owner' as const
    }
  ];

  // 1. Get or create the default workspace
  let workspaceId: string;
  const existingUser = await userRepository.findByEmail(defaultUsers[0].email);
  if (existingUser) {
    workspaceId = existingUser.workspaceId;
  } else {
    const ws = await workspaceRepository.create('Semimatrix Cleanroom 300mm Fab');
    workspaceId = typeof ws._id === 'string' ? ws._id : ws._id.toString();
  }

  // 2. Ensure each default user exists
  for (const u of defaultUsers) {
    const existing = await userRepository.findByEmail(u.email);
    if (!existing) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(u.password, salt);
      await userRepository.create({
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
        workspaceId
      });
      logger.info(`Auto-seeded demo account: ${u.email}`);
    }
  }

  // 3. Ensure synthetic cleanroom telemetry exists for this workspace
  const equipment = await equipmentRepository.find(workspaceId, {}, { limit: 1 });
  let equipmentCount = equipment.length;

  if (equipmentCount === 0) {
    logger.info(`Generating initial cleanroom demo telemetry for workspace ${workspaceId}...`);
    const result = await syntheticGeneratorService.generateAndPersist(workspaceId, {
      seed: 42,
      days: 7,
      toolCountPerType: 3
    });
    equipmentCount = result.equipmentCount;

    // Save generated CSV export for demo download
    const exportDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    const csvPath = path.join(exportDir, 'semimatrix_seeded_demo.csv');
    fs.writeFileSync(csvPath, result.csvContent, 'utf-8');

    logger.info({
      msg: 'Cleanroom demo telemetry generated successfully',
      equipmentCount: result.equipmentCount,
      readingCount: result.readingCount,
      lotCount: result.lotCount,
      injectedEvents: result.injectedEventCount
    });
  }

  return { workspaceId, equipmentCount };
}
