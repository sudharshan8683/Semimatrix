import { DatasetModel, DataSourceType, ICapabilityMatrix } from '../models/Dataset.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface DatasetEntity extends BaseEntity {
  workspaceId: string;
  name: string;
  sourceType: DataSourceType;
  storedFilename?: string;
  originalFilename?: string;
  fileSizeBytes: number;
  rowCount: number;
  columnCount: number;
  uploadedBy?: string;
  profilingSummary?: any;
  columnMapping?: Record<string, string>;
  capabilityMatrix?: ICapabilityMatrix;
  validationReport?: any;
}

export class DatasetRepository extends BaseRepository<DatasetEntity> {
  constructor() {
    super('datasets', DatasetModel);
  }
}

export const datasetRepository = new DatasetRepository();
