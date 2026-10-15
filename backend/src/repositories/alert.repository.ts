import { AlertModel, AlertSeverity, AlertState } from '../models/Alert.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface AlertEntity extends BaseEntity {
  workspaceId: string;
  equipmentId?: string;
  lotId?: string;
  severity: AlertSeverity;
  state: AlertState;
  title: string;
  description: string;
  parameterName?: string;
  actualValue?: number;
  thresholdValue?: number;
  ruleViolated?: string;
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export class AlertRepository extends BaseRepository<AlertEntity> {
  constructor() {
    super('alerts', AlertModel);
  }
}

export const alertRepository = new AlertRepository();
