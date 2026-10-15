import { AuditLogModel, AuditAction } from '../models/AuditLog.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface AuditLogEntity extends BaseEntity {
  workspaceId: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogRepository extends BaseRepository<AuditLogEntity> {
  constructor() {
    super('audit_logs', AuditLogModel);
  }

  async record(
    workspaceId: string,
    action: AuditAction,
    resourceType: string,
    params: {
      userId?: string;
      userEmail?: string;
      resourceId?: string;
      details?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<AuditLogEntity> {
    return this.create(workspaceId, {
      workspaceId,
      action,
      resourceType,
      ...params
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
