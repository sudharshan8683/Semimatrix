import { Router } from 'express';
import { investigationController } from '../controllers/investigation.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const investigationRouter = Router();

investigationRouter.get('/', requireAuth, investigationController.list.bind(investigationController));
investigationRouter.get('/:id', requireAuth, investigationController.getById.bind(investigationController));
investigationRouter.post('/trigger', requireAuth, requireRole(['owner', 'analyst']), investigationController.trigger.bind(investigationController));
