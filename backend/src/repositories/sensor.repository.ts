import { SensorReadingModel } from '../models/SensorReading.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface SensorReadingEntity extends BaseEntity {
  workspaceId: string;
  equipmentId: string;
  timestamp: Date;
  stage: string;
  lotId?: string;
  datasetId?: string;
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  metrics: Record<string, number>;
  status?: string;
  isAnomaly?: boolean;
}

export class SensorRepository extends BaseRepository<SensorReadingEntity> {
  constructor() {
    super('sensor_readings', SensorReadingModel);
  }

  async insertBatch(workspaceId: string, readings: Omit<SensorReadingEntity, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    if (this.isMongooseActive()) {
      const docs = readings.map((r) => ({
        ...r,
        workspaceId,
        timestamp: new Date(r.timestamp)
      }));
      const res = await SensorReadingModel.insertMany(docs);
      return res.length;
    }

    const col = this.store.getCollection(this.collectionName);
    for (const r of readings) {
      const id = this.generateId();
      col.set(id, {
        ...r,
        _id: id,
        workspaceId,
        timestamp: new Date(r.timestamp),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    return readings.length;
  }

  async getTelemetryHistory(
    workspaceId: string,
    equipmentId: string,
    limit = 50,
    startTime?: Date,
    endTime?: Date
  ): Promise<SensorReadingEntity[]> {
    if (this.isMongooseActive()) {
      const filter: any = { workspaceId, equipmentId };
      if (startTime || endTime) {
        filter.timestamp = {};
        if (startTime) filter.timestamp.$gte = startTime;
        if (endTime) filter.timestamp.$lte = endTime;
      }
      const docs = await SensorReadingModel.find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
      return docs.map((d) => d.toObject() as unknown as SensorReadingEntity).reverse();
    }

    const col = this.store.getCollection(this.collectionName);
    const readings = Array.from(col.values()).filter((r: any) => {
      if (r.workspaceId !== workspaceId) return false;
      if (r.equipmentId !== equipmentId) return false;
      const t = new Date(r.timestamp).getTime();
      if (startTime && t < startTime.getTime()) return false;
      if (endTime && t > endTime.getTime()) return false;
      return true;
    }) as SensorReadingEntity[];

    readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return readings.slice(-limit);
  }
}

export const sensorRepository = new SensorRepository();
