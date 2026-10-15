import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  workspaceId: mongoose.Types.ObjectId;
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
  datasetSummary?: {
    datasetId?: string;
    rowCount?: number;
    toolsCovered?: number;
  };
  fileFormat: 'pdf' | 'csv' | 'json';
  downloadUrl?: string;
  generatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    analysisType: {
      type: String,
      required: true,
      enum: ['operations_summary', 'spc_capability', 'yield_loss', 'maintenance_risk', 'investigation']
    },
    dataBasis: {
      type: String,
      required: true,
      enum: ['synthetic', 'uploaded', 'benchmark', 'live']
    },
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    kpis: { type: Schema.Types.Mixed, required: true },
    findings: [{ type: String }],
    recommendedActions: [{ type: String }],
    limitationsAndAssumptions: [{ type: String }],
    datasetSummary: { type: Schema.Types.Mixed },
    fileFormat: { type: String, enum: ['pdf', 'csv', 'json'], default: 'pdf' },
    downloadUrl: { type: String },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

ReportSchema.index({ workspaceId: 1, createdAt: -1 });

export const ReportModel = mongoose.model<IReport>('Report', ReportSchema);
