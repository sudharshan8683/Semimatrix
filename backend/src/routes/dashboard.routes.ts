import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.get('/overview', requireAuth, dashboardController.getOverview.bind(dashboardController));
dashboardRouter.get('/metrics-metadata', requireAuth, dashboardController.getMetadata.bind(dashboardController));
