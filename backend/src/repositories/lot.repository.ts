import { WaferLotModel, IStageRecord } from '../models/WaferLot.js';
import { BaseEntity, BaseRepository } from './base.repository.js';

export interface WaferLotEntity extends BaseEntity {
  workspaceId: string;
  lotId: string;
  recipeId: string;
  totalUnits: number;
  goodUnits: number;
  defectCount: number;
  yieldPercent: number;
  startTime: Date;
  endTime?: Date;
  currentStage: string;
  status: 'in_progress' | 'completed' | 'scrapped' | 'on_hold';
  stages: IStageRecord[];
  sourceType: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  datasetId?: string;
}

export class LotRepository extends BaseRepository<WaferLotEntity> {
  constructor() {
    super('wafer_lots', WaferLotModel);
  }

  async findByLotId(workspaceId: string, lotId: string): Promise<WaferLotEntity | null> {
    const list = await this.find(workspaceId, { lotId }, { limit: 1 });
    return list[0] ?? null;
  }
}

export const lotRepository = new LotRepository();
