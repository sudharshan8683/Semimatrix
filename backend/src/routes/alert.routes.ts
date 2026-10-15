import { Router } from 'express';
import { alertController } from '../controllers/alert.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const alertRouter = Router();

alertRouter.get('/', requireAuth, alertController.list.bind(alertController));
alertRouter.post('/:id/acknowledge', requireAuth, requireRole(['owner', 'analyst']), alertController.acknowledge.bind(alertController));
alertRouter.post('/:id/resolve', requireAuth, requireRole(['owner', 'analyst']), alertController.resolve.bind(alertController));
