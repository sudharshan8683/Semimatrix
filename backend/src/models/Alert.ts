import mongoose, { Document, Schema } from 'mongoose';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertState = 'open' | 'acknowledged' | 'resolved';

export interface IAlert extends Document {
  workspaceId: mongoose.Types.ObjectId;
  equipmentId?: string;
  lotId?: string;
  severity: AlertSeverity;
  state: AlertState;
  title: string;
  description: string;
  parameterName?: string;
  actualValue?: number;
  thresholdValue?: number;
  ruleViolated?: string; // e.g. "Nelson Rule 1 (> 3 sigma)"
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    equipmentId: { type: String, index: true },
    lotId: { type: String, index: true },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'critical'],
      default: 'warning'
    },
    state: {
      type: String,
      required: true,
      enum: ['open', 'acknowledged', 'resolved'],
      default: 'open'
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    parameterName: { type: String },
    actualValue: { type: Number },
    thresholdValue: { type: Number },
    ruleViolated: { type: String },
    sourceType: {
      type: String,
      enum: ['synthetic', 'uploaded', 'benchmark', 'live'],
      default: 'synthetic'
    },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String }
  },
  { timestamps: true }
);

AlertSchema.index({ workspaceId: 1, state: 1, severity: 1 });
AlertSchema.index({ workspaceId: 1, createdAt: -1 });

export const AlertModel = mongoose.model<IAlert>('Alert', AlertSchema);
