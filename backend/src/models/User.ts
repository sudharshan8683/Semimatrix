import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'owner' | 'analyst' | 'viewer';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  workspaceId: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['owner', 'analyst', 'viewer'], default: 'owner' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
