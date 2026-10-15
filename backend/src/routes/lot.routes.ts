import { Router } from 'express';
import { lotController } from '../controllers/lot.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const lotRouter = Router();

lotRouter.get('/', requireAuth, lotController.list.bind(lotController));
lotRouter.get('/analytics/by-stage', requireAuth, lotController.getYieldByStage.bind(lotController));
lotRouter.get('/analytics/by-tool', requireAuth, lotController.getYieldByTool.bind(lotController));
lotRouter.get('/:id', requireAuth, lotController.getById.bind(lotController));
