import { Router } from 'express';
import { mlController } from '../controllers/ml.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const mlRouter = Router();

mlRouter.get('/predictive-maintenance', requireAuth, mlController.getPredictiveMaintenance.bind(mlController));
mlRouter.post('/predict/secom', requireAuth, mlController.predictSecom.bind(mlController));
mlRouter.get('/model-card', requireAuth, mlController.getModelCard.bind(mlController));
