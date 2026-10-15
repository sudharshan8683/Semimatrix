import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const equipmentRouter = Router();

equipmentRouter.get('/', requireAuth, equipmentController.list.bind(equipmentController));
equipmentRouter.get('/:id', requireAuth, equipmentController.getById.bind(equipmentController));
equipmentRouter.get('/:id/telemetry', requireAuth, equipmentController.getTelemetry.bind(equipmentController));
equipmentRouter.get('/:id/spc', requireAuth, equipmentController.getSpcAnalysis.bind(equipmentController));
