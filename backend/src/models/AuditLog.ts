import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 'login' | 'logout' | 'upload' | 'delete' | 'export' | 'alert_ack' | 'alert_resolve';

export interface IAuditLog extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String },
    action: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'upload', 'delete', 'export', 'alert_ack', 'alert_resolve']
    },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
