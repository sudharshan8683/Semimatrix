import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { userRepository, UserEntity } from '../repositories/user.repository.js';
import { workspaceRepository } from '../repositories/workspace.repository.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';
import { equipmentRepository } from '../repositories/equipment.repository.js';
import { sensorRepository } from '../repositories/sensor.repository.js';
import { lotRepository } from '../repositories/lot.repository.js';
import { datasetRepository } from '../repositories/dataset.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { investigationRepository } from '../repositories/investigation.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { injectedEventRepository } from '../repositories/injectedEvent.repository.js';
import { UserRole } from '../models/User.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    workspaceId: string;
  };
  tokens: TokenPair;
}

export class AuthService {
  private generateTokens(user: { id: string; email: string; role: UserRole; workspaceId: string }): TokenPair {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
    });

    return { accessToken, refreshToken };
  }

  async register(params: {
    email: string;
    password: string;
    fullName: string;
    workspaceName?: string;
    ipAddress?: string;
  }): Promise<AuthSession> {
    const existing = await userRepository.findByEmail(params.email);
    if (existing) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    // 1. Create Workspace for User
    const wsName = params.workspaceName?.trim() || `${params.fullName.trim()}'s Fab`;
    const workspace = await workspaceRepository.create(wsName);

    // 2. Hash Password securely with bcrypt
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(params.password, salt);

    // 3. Create User with owner role in the new workspace
    const user = await userRepository.create({
      email: params.email,
      passwordHash,
      fullName: params.fullName.trim(),
      role: 'owner',
      workspaceId: userWorkspaceIdString(workspace._id)
    });

    // 4. Record audit log
    await auditLogRepository.record(workspace._id, 'login', 'user', {
      userId: user._id,
      userEmail: user.email,
      resourceId: user._id,
      details: { action: 'register_and_login' },
      ipAddress: params.ipAddress
    });

    const tokens = this.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
      workspaceId: workspace._id
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        workspaceId: workspace._id
      },
      tokens
    };
  }

  async login(params: {
    email: string;
    password: string;
    ipAddress?: string;
  }): Promise<AuthSession> {
    const user = await userRepository.findByEmail(params.email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValid = await bcrypt.compare(params.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    await userRepository.updateLastLogin(user._id);

    await auditLogRepository.record(user.workspaceId, 'login', 'user', {
      userId: user._id,
      userEmail: user.email,
      resourceId: user._id,
      ipAddress: params.ipAddress
    });

    const tokens = this.generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        workspaceId: user.workspaceId
      },
      tokens
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        email: string;
        role: UserRole;
        workspaceId: string;
      };

      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw AppError.unauthorized('User not found or session revoked');
      }

      // Rotate tokens
      return this.generateTokens({
        id: user._id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspaceId
      });
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  async deleteWorkspaceData(workspaceId: string, userId: string): Promise<{ deleted: boolean; summary: Record<string, number> }> {
    const summary: Record<string, number> = {
      equipment: await equipmentRepository.deleteManyByWorkspace(workspaceId),
      sensorReadings: await sensorRepository.deleteManyByWorkspace(workspaceId),
      lots: await lotRepository.deleteManyByWorkspace(workspaceId),
      datasets: await datasetRepository.deleteManyByWorkspace(workspaceId),
      alerts: await alertRepository.deleteManyByWorkspace(workspaceId),
      investigations: await investigationRepository.deleteManyByWorkspace(workspaceId),
      reports: await reportRepository.deleteManyByWorkspace(workspaceId),
      injectedEvents: await injectedEventRepository.deleteManyByWorkspace(workspaceId),
      auditLogs: await auditLogRepository.deleteManyByWorkspace(workspaceId),
      users: await userRepository.deleteByWorkspace(workspaceId)
    };

    await workspaceRepository.delete(workspaceId);

    return { deleted: true, summary };
  }
}

function userWorkspaceIdString(id: any): string {
  return typeof id === 'string' ? id : id.toString();
}

export const authService = new AuthService();
