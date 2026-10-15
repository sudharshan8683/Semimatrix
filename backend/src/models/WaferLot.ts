import mongoose, { Document, Schema } from 'mongoose';

export interface IStageRecord {
  stage: string;
  equipmentId: string;
  startTime: Date;
  endTime: Date;
  status: 'passed' | 'failed' | 'warning' | 'reworked';
  parametersAvg?: Record<string, number>;
  defectsDetected?: number;
}

export interface IWaferLot extends Document {
  workspaceId: mongoose.Types.ObjectId;
  lotId: string;
  recipeId: string;
  totalUnits: number;
  goodUnits: number;
  defectCount: number;
  yieldPercent: number;
  startTime: Date;
  endTime?: Date;
  currentStage: string;
  status: 'in_progress' | 'completed' | 'scrapped' | 'on_hold';
  stages: IStageRecord[];
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  datasetId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StageRecordSchema = new Schema<IStageRecord>(
  {
    stage: { type: String, required: true },
    equipmentId: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['passed', 'failed', 'warning', 'reworked'], default: 'passed' },
    parametersAvg: { type: Schema.Types.Mixed },
    defectsDetected: { type: Number, default: 0 }
  },
  { _id: false }
);

const WaferLotSchema = new Schema<IWaferLot>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    lotId: { type: String, required: true, trim: true },
    recipeId: { type: String, required: true, trim: true },
    totalUnits: { type: Number, required: true },
    goodUnits: { type: Number, required: true },
    defectCount: { type: Number, required: true },
    yieldPercent: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    currentStage: { type: String, required: true },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'scrapped', 'on_hold'],
      default: 'in_progress'
    },
    stages: [StageRecordSchema],
    sourceType: {
      type: String,
      enum: ['synthetic', 'uploaded', 'benchmark', 'live'],
      default: 'synthetic'
    },
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', index: true }
  },
  { timestamps: true }
);

WaferLotSchema.index({ workspaceId: 1, lotId: 1 }, { unique: true });
WaferLotSchema.index({ workspaceId: 1, startTime: -1 });

export const WaferLotModel = mongoose.model<IWaferLot>('WaferLot', WaferLotSchema);
