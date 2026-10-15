import { ReportModel } from '../models/Report.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface ReportEntity extends BaseEntity {
  workspaceId: string;
  title: string;
  analysisType: 'operations_summary' | 'spc_capability' | 'yield_loss' | 'maintenance_risk' | 'investigation';
  dataBasis: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  dateRange: {
    start: Date;
    end: Date;
  };
  kpis: Record<string, number | string>;
  findings: string[];
  recommendedActions: string[];
  limitationsAndAssumptions: string[];
  datasetSummary?: any;
  fileFormat: 'pdf' | 'csv' | 'json';
  downloadUrl?: string;
  generatedBy?: string;
}

export class ReportRepository extends BaseRepository<ReportEntity> {
  constructor() {
    super('reports', ReportModel);
  }
}

export const reportRepository = new ReportRepository();
