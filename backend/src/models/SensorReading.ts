import mongoose, { Document, Schema } from 'mongoose';

export interface ISensorReading extends Document {
  workspaceId: mongoose.Types.ObjectId;
  equipmentId: string;
  timestamp: Date;
  stage: string;
  lotId?: string;
  datasetId?: mongoose.Types.ObjectId;
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  metrics: Record<string, number>;
  status?: string;
  isAnomaly?: boolean;
}

const SensorReadingSchema = new Schema<ISensorReading>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    equipmentId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true },
    stage: { type: String, required: true },
    lotId: { type: String, index: true },
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', index: true },
    sourceType: {
      type: String,
      enum: ['synthetic', 'uploaded', 'benchmark', 'live'],
      default: 'synthetic'
    },
    metrics: { type: Schema.Types.Mixed, required: true },
    status: { type: String, default: 'processing' },
    isAnomaly: { type: Boolean, default: false }
  },
  { timestamps: false }
);

SensorReadingSchema.index({ workspaceId: 1, equipmentId: 1, timestamp: -1 });
SensorReadingSchema.index({ workspaceId: 1, lotId: 1 });
SensorReadingSchema.index({ workspaceId: 1, datasetId: 1 });

export const SensorReadingModel = mongoose.model<ISensorReading>('SensorReading', SensorReadingSchema);
