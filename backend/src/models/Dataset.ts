import mongoose, { Document, Schema } from 'mongoose';

export type DataSourceType = 'synthetic' | 'uploaded' | 'benchmark' | 'live';

export interface ICapabilityStatus {
  available: boolean;
  status: 'available' | 'partially_available' | 'blocked';
  missingFields: string[];
  explanation: string;
}

export interface ICapabilityMatrix {
  yieldAnalysis: ICapabilityStatus;
  spcControl: ICapabilityStatus;
  anomalyDetection: ICapabilityStatus;
  predictiveMaintenance: ICapabilityStatus;
  lotTraceability: ICapabilityStatus;
}

export interface IDataset extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  sourceType: DataSourceType;
  storedFilename?: string;
  originalFilename?: string;
  fileSizeBytes: number;
  rowCount: number;
  columnCount: number;
  uploadedBy?: mongoose.Types.ObjectId;
  profilingSummary?: {
    columns: Array<{
      name: string;
      detectedType: 'number' | 'string' | 'date' | 'boolean';
      missingPercent: number;
      uniqueCount: number;
      min?: number;
      max?: number;
      isConstant: boolean;
      unitHint?: string;
    }>;
    duplicateRows: number;
    timestampColumn?: string;
    detectedTimezone?: string;
    qualityScore: number;
  };
  columnMapping?: Record<string, string>; // rawColumn -> canonicalField
  capabilityMatrix?: ICapabilityMatrix;
  validationReport?: {
    validRows: number;
    rejectedRows: number;
    errors: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const DatasetSchema = new Schema<IDataset>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      required: true,
      enum: ['synthetic', 'uploaded', 'benchmark', 'live'],
      default: 'uploaded'
    },
    storedFilename: { type: String },
    originalFilename: { type: String },
    fileSizeBytes: { type: Number, default: 0 },
    rowCount: { type: Number, default: 0 },
    columnCount: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    profilingSummary: { type: Schema.Types.Mixed },
    columnMapping: { type: Schema.Types.Mixed },
    capabilityMatrix: { type: Schema.Types.Mixed },
    validationReport: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

DatasetSchema.index({ workspaceId: 1, createdAt: -1 });

export const DatasetModel = mongoose.model<IDataset>('Dataset', DatasetSchema);
