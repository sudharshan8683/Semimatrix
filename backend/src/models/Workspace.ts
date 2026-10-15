import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  ownerId?: mongoose.Types.ObjectId;
  retentionDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    retentionDays: { type: Number, default: 90 }
  },
  { timestamps: true }
);

export const WorkspaceModel = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
