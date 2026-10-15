import mongoose, { Document, Schema } from 'mongoose';

export type EquipmentType = 'deposition_cvd' | 'etch' | 'cmp' | 'lithography_track' | 'ion_implant';
export type EquipmentStatus = 'idle' | 'processing' | 'maintenance' | 'error' | 'offline';

export interface IParameterSpec {
  name: string;
  unit: string;
  nominal: number;
  usl: number; // Upper spec limit
  lsl: number; // Lower spec limit
  ucl?: number; // Upper control limit (Phase I)
  lcl?: number; // Lower control limit (Phase I)
  cl?: number;  // Center line (mean)
  rangeMin: number;
  rangeMax: number;
}

export interface IEquipment extends Document {
  workspaceId: mongoose.Types.ObjectId;
  equipmentId: string;
  name: string;
  type: EquipmentType;
  locationBay: string;
  status: EquipmentStatus;
  lastMaintenanceAt?: Date;
  installedAt?: Date;
  parameters: IParameterSpec[];
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  createdAt: Date;
  updatedAt: Date;
}

const ParameterSpecSchema = new Schema<IParameterSpec>(
  {
    name: { type: String, required: true },
    unit: { type: String, required: true },
    nominal: { type: Number, required: true },
    usl: { type: Number, required: true },
    lsl: { type: Number, required: true },
    ucl: { type: Number },
    lcl: { type: Number },
    cl: { type: Number },
    rangeMin: { type: Number, required: true },
    rangeMax: { type: Number, required: true }
  },
  { _id: false }
);

const EquipmentSchema = new Schema<IEquipment>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    equipmentId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['deposition_cvd', 'etch', 'cmp', 'lithography_track', 'ion_implant']
    },
    locationBay: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['idle', 'processing', 'maintenance', 'error', 'offline'],
      default: 'idle'
    },
    lastMaintenanceAt: { type: Date },
    installedAt: { type: Date },
    parameters: [ParameterSpecSchema],
    sourceType: {
      type: String,
      enum: ['synthetic', 'uploaded', 'benchmark', 'live'],
      default: 'synthetic'
    }
  },
  { timestamps: true }
);

EquipmentSchema.index({ workspaceId: 1, equipmentId: 1 }, { unique: true });

export const EquipmentModel = mongoose.model<IEquipment>('Equipment', EquipmentSchema);
