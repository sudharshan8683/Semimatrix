import mongoose, { Document, Schema } from 'mongoose';

export interface ICandidateFactor {
  parameterName: string;
  equipmentId: string;
  stage: string;
  effectSize: number; // e.g. Cohen's d or delta mean
  sampleSizeExcursion: number;
  sampleSizeBaseline: number;
  confidence: 'low' | 'medium' | 'high';
  associationDescription: string;
  alternativeExplanations: string[];
  verificationChecklist: string[];
  chartData?: Array<{ time: string; excursionValue: number; baselineMean: number }>;
}

export interface IInvestigation extends Document {
  workspaceId: mongoose.Types.ObjectId;
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
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateFactorSchema = new Schema<ICandidateFactor>(
  {
    parameterName: { type: String, required: true },
    equipmentId: { type: String, required: true },
    stage: { type: String, required: true },
    effectSize: { type: Number, required: true },
    sampleSizeExcursion: { type: Number, required: true },
    sampleSizeBaseline: { type: Number, required: true },
    confidence: { type: String, enum: ['low', 'medium', 'high'], required: true },
    associationDescription: { type: String, required: true },
    alternativeExplanations: [{ type: String }],
    verificationChecklist: [{ type: String }],
    chartData: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const InvestigationSchema = new Schema<IInvestigation>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    excursionType: {
      type: String,
      required: true,
      enum: ['yield_drop', 'equipment_drift', 'process_anomaly']
    },
    targetLotId: { type: String },
    targetEquipmentId: { type: String },
    windowStart: { type: Date, required: true },
    windowEnd: { type: Date, required: true },
    status: { type: String, enum: ['active', 'in_review', 'closed'], default: 'active' },
    summary: { type: String, required: true },
    affectedLots: [{ type: String }],
    involvedEquipment: [{ type: String }],
    candidateFactors: [CandidateFactorSchema],
    dataCompletenessWarning: { type: String },
    sourceType: {
      type: String,
      enum: ['synthetic', 'uploaded', 'benchmark', 'live'],
      default: 'synthetic'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

InvestigationSchema.index({ workspaceId: 1, createdAt: -1 });

export const InvestigationModel = mongoose.model<IInvestigation>('Investigation', InvestigationSchema);
