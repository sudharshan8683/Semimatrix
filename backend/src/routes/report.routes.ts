import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const reportRouter = Router();

reportRouter.get('/', requireAuth, reportController.list.bind(reportController));
reportRouter.post('/generate', requireAuth, requireRole(['owner', 'analyst']), reportController.generate.bind(reportController));
reportRouter.get('/:id', requireAuth, reportController.getById.bind(reportController));
reportRouter.get('/:id/export/csv', requireAuth, reportController.exportCsv.bind(reportController));
