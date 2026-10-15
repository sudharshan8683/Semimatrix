import { InjectedEventModel, InjectedEventType } from '../models/InjectedEvent.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface InjectedEventEntity extends BaseEntity {
  workspaceId: string;
  datasetId?: string;
  equipmentId?: string;
  lotId?: string;
  eventType: InjectedEventType;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedParameters: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedLeadTimeHours?: number;
  detectedAt?: Date;
  isDetected: boolean;
}

export class InjectedEventRepository extends BaseRepository<InjectedEventEntity> {
  constructor() {
    super('injected_events', InjectedEventModel);
  }
}

export const injectedEventRepository = new InjectedEventRepository();
