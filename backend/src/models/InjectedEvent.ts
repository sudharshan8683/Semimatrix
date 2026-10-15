import mongoose, { Document, Schema } from 'mongoose';

export type InjectedEventType =
  | 'gradual_drift'
  | 'sudden_spike'
  | 'sensor_stuck'
  | 'contamination_yield_excursion'
  | 'pm_improvement';

export interface IInjectedEvent extends Document {
  workspaceId: mongoose.Types.ObjectId;
  datasetId?: mongoose.Types.ObjectId;
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
  createdAt: Date;
}

const InjectedEventSchema = new Schema<IInjectedEvent>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', index: true },
    equipmentId: { type: String, index: true },
    lotId: { type: String, index: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        'gradual_drift',
        'sudden_spike',
        'sensor_stuck',
        'contamination_yield_excursion',
        'pm_improvement'
      ]
    },
    description: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    affectedParameters: [{ type: String }],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    expectedLeadTimeHours: { type: Number },
    detectedAt: { type: Date },
    isDetected: { type: Boolean, default: false }
  },
  { timestamps: true }
);

InjectedEventSchema.index({ workspaceId: 1, eventType: 1 });

export const InjectedEventModel = mongoose.model<IInjectedEvent>('InjectedEvent', InjectedEventSchema);
