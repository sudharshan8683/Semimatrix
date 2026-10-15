import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, fullName, workspaceName } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const session = await authService.register({
        email,
        password,
        fullName,
        workspaceName,
        ipAddress
      });

      res.cookie('accessToken', session.tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 mins
      });

      res.cookie('refreshToken', session.tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          user: session.user,
          tokens: session.tokens
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const session = await authService.login({
        email,
        password,
        ipAddress
      });

      res.cookie('accessToken', session.tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', session.tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        data: {
          user: session.user,
          tokens: session.tokens
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Refresh token missing'
          }
        });
        return;
      }

      const newTokens = await authService.refresh(refreshToken);

      res.cookie('accessToken', newTokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', newTokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        data: {
          tokens: newTokens
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await auditLogRepository.record(req.user.workspaceId, 'logout', 'user', {
          userId: req.user.userId,
          userEmail: req.user.email
        });
      }

      res.clearCookie('accessToken', COOKIE_OPTIONS);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: { user: req.user }
    });
  }

  async deleteWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const userId = req.user!.userId;

      const result = await authService.deleteWorkspaceData(workspaceId, userId);

      res.clearCookie('accessToken', COOKIE_OPTIONS);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          message: 'Workspace and all associated datasets, telemetry, and records permanently deleted.',
          summary: result.summary
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
