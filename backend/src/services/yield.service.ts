import { lotRepository, WaferLotEntity } from '../repositories/lot.repository.js';
import { computeYield, computeDefectRate } from '../metrics/calculations.js';

export interface StageYieldBreakdown {
  stage: string;
  lotsPassed: number;
  totalUnitsProcessed: number;
  defectsDetected: number;
  defectRate: number; // %
  stageYield: number; // %
}

export interface ToolYieldCorrelation {
  equipmentId: string;
  stage: string;
  lotsProcessed: number;
  totalUnits: number;
  goodUnits: number;
  meanYield: number;
  scrapCount: number;
  scrapRate: number;
  isOutlier: boolean;
}

export class YieldService {
  async getLots(
    workspaceId: string,
    filter: { status?: string; recipeId?: string; sourceType?: string } = {}
  ): Promise<WaferLotEntity[]> {
    const query: Record<string, any> = {};
    if (filter.status) query.status = filter.status;
    if (filter.recipeId) query.recipeId = filter.recipeId;
    if (filter.sourceType) query.sourceType = filter.sourceType;

    return lotRepository.find(workspaceId, query, { sort: { startTime: -1 } });
  }

  async getLotTraceability(workspaceId: string, lotId: string): Promise<WaferLotEntity | null> {
    let lot = await lotRepository.findByLotId(workspaceId, lotId);
    if (!lot) {
      lot = await lotRepository.findById(workspaceId, lotId);
    }
    return lot;
  }

  async getYieldByStage(
    workspaceId: string,
    filter: { sourceType?: string } = {}
  ): Promise<StageYieldBreakdown[]> {
    const lots = await lotRepository.find(workspaceId, {
      sourceType: filter.sourceType ?? 'synthetic'
    });

    const stageMap = new Map<
      string,
      { lots: number; totalUnits: number; defects: number }
    >();

    for (const lot of lots) {
      for (const st of lot.stages || []) {
        const existing = stageMap.get(st.stage) || {
          lots: 0,
          totalUnits: 0,
          defects: 0
        };
        existing.lots += 1;
        existing.totalUnits += lot.totalUnits;
        existing.defects += st.defectsDetected || 0;
        stageMap.set(st.stage, existing);
      }
    }

    const result: StageYieldBreakdown[] = [];
    for (const [stage, data] of stageMap.entries()) {
      const defectRate = computeDefectRate(data.defects, data.totalUnits);
      const stageYield = Number((100 - defectRate).toFixed(2));
      result.push({
        stage,
        lotsPassed: data.lots,
        totalUnitsProcessed: data.totalUnits,
        defectsDetected: data.defects,
        defectRate,
        stageYield
      });
    }

    return result;
  }

  async getYieldByTool(
    workspaceId: string,
    filter: { sourceType?: string } = {}
  ): Promise<ToolYieldCorrelation[]> {
    const lots = await lotRepository.find(workspaceId, {
      sourceType: filter.sourceType ?? 'synthetic'
    });

    const toolMap = new Map<
      string,
      { stage: string; lots: number; totalUnits: number; goodUnits: number; defects: number }
    >();

    for (const lot of lots) {
      for (const st of lot.stages || []) {
        const key = st.equipmentId;
        const existing = toolMap.get(key) || {
          stage: st.stage,
          lots: 0,
          totalUnits: 0,
          goodUnits: 0,
          defects: 0
        };
        existing.lots += 1;
        existing.totalUnits += lot.totalUnits;
        existing.goodUnits += lot.goodUnits;
        existing.defects += st.defectsDetected || 0;
        toolMap.set(key, existing);
      }
    }

    // Compute fleet-wide mean yield to identify outliers (> 2 sigma or > 5% below average)
    let totalFleetGood = 0;
    let totalFleetUnits = 0;
    for (const data of toolMap.values()) {
      totalFleetGood += data.goodUnits;
      totalFleetUnits += data.totalUnits;
    }
    const fleetMeanYield = computeYield(totalFleetGood, totalFleetUnits);

    const result: ToolYieldCorrelation[] = [];
    for (const [toolId, data] of toolMap.entries()) {
      const meanYield = computeYield(data.goodUnits, data.totalUnits);
      const scrapRate = computeDefectRate(data.defects, data.totalUnits);
      const isOutlier = meanYield < fleetMeanYield - 4.0; // Significant yield drop

      result.push({
        equipmentId: toolId,
        stage: data.stage,
        lotsProcessed: data.lots,
        totalUnits: data.totalUnits,
        goodUnits: data.goodUnits,
        meanYield,
        scrapCount: data.defects,
        scrapRate,
        isOutlier
      });
    }

    result.sort((a, b) => a.meanYield - b.meanYield);
    return result;
  }
}

export const yieldService = new YieldService();
