import { EquipmentModel, EquipmentType, EquipmentStatus, IParameterSpec } from '../models/Equipment.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface EquipmentEntity extends BaseEntity {
  workspaceId: string;
  equipmentId: string;
  name: string;
  type: EquipmentType;
  locationBay: string;
  status: EquipmentStatus;
  lastMaintenanceAt?: Date;
  installedAt?: Date;
  parameters: IParameterSpec[];
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
}

export class EquipmentRepository extends BaseRepository<EquipmentEntity> {
  constructor() {
    super('equipment', EquipmentModel);
  }

  async findByEquipmentId(workspaceId: string, equipmentId: string): Promise<EquipmentEntity | null> {
    const list = await this.find(workspaceId, { equipmentId }, { limit: 1 });
    return list[0] ?? null;
  }
}

export const equipmentRepository = new EquipmentRepository();
