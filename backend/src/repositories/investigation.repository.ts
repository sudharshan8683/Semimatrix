import { InvestigationModel, ICandidateFactor } from '../models/Investigation.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface InvestigationEntity extends BaseEntity {
  workspaceId: string;
  title: string;
  excursionType: 'yield_drop' | 'equipment_drift' | 'process_anomaly';
  targetLotId?: string;
  targetEquipmentId?: string;
  windowStart: Date;
  windowEnd: Date;
  status: 'active' | 'in_review' | 'closed';
  summary: string;
  affectedLots: string[];
  involvedEquipment: string[];
  candidateFactors: ICandidateFactor[];
  dataCompletenessWarning?: string;
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  createdBy?: string;
}

export class InvestigationRepository extends BaseRepository<InvestigationEntity> {
  constructor() {
    super('investigations', InvestigationModel);
  }
}

export const investigationRepository = new InvestigationRepository();
