import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';
import { AppError } from '../errors/AppError.js';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(`Operation requires one of the following roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}
