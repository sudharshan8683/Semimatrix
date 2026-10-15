import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

export const authRouter = Router();

// Rate limiter for authentication endpoints: max 30 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  }
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  fullName: z.string().min(2, 'Full name required').max(100),
  workspaceName: z.string().max(100).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required')
});

authRouter.post(
  '/register',
  authLimiter,
  validateRequest({ body: registerSchema }),
  authController.register.bind(authController)
);

authRouter.post(
  '/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  authController.login.bind(authController)
);

authRouter.post('/refresh', authController.refresh.bind(authController));
authRouter.post('/logout', authController.logout.bind(authController));
authRouter.get('/me', requireAuth, authController.me.bind(authController));

// Delete My Data endpoint (Owner only)
authRouter.delete(
  '/workspace/data',
  requireAuth,
  requireRole(['owner']),
  authController.deleteWorkspace.bind(authController)
);
