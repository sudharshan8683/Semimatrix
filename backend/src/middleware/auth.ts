import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { UserRole } from '../models/User.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  workspaceId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      workspaceId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(AppError.unauthorized('Authentication required: Missing or invalid token'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
      workspaceId: string;
    };

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      workspaceId: decoded.workspaceId
    };

    // CRITICAL: workspaceId is ALWAYS derived from verified token, NEVER from body/query
    req.workspaceId = decoded.workspaceId;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'UNAUTHORIZED', 'Access token expired. Please refresh your session.'));
    }
    return next(AppError.unauthorized('Invalid authentication token'));
  }
}
