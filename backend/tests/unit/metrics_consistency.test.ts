import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeAvailability,
  computeUtilization,
  computeYield,
  computeDefectRate,
  computeThroughput,
  computeCp,
  computeCpk
} from '../../src/metrics/calculations.js';
import { metricsService } from '../../src/services/metrics.service.js';
import { InMemoryStore } from '../../src/repositories/base.repository.js';
import { equipmentRepository } from '../../src/repositories/equipment.repository.js';
import { lotRepository } from '../../src/repositories/lot.repository.js';
import { alertRepository } from '../../src/repositories/alert.repository.js';

describe('Stage 3: Metrics Calculation Precision & Card/Chart/Table Consistency', () => {
  beforeEach(() => {
    InMemoryStore.getInstance().clearAll();
  });

  describe('Formula Unit Tests', () => {
    it('computes Operational Availability accurately and clamps between 0-100%', () => {
      // 168 scheduled hours, 8.4 hours downtime -> 95% availability
      expect(computeAvailability(168, 8.4)).toBe(95.0);
      expect(computeAvailability(100, 0)).toBe(100.0);
      expect(computeAvailability(100, 100)).toBe(0.0);
      expect(computeAvailability(100, 150)).toBe(0.0); // Clamped
      expect(computeAvailability(0, 10)).toBe(0);
    });

    it('computes Equipment Utilization relative to available operable time', () => {
      // 120 processing hours out of 150 available hours -> 80% utilization
      expect(computeUtilization(120, 150)).toBe(80.0);
      expect(computeUtilization(0, 100)).toBe(0.0);
      expect(computeUtilization(50, 0)).toBe(0.0);
    });

    it('computes Wafer Yield and Defect Rate matching mathematical inverse (Y + DR = 100%)', () => {
      // 24 good units out of 25 total units -> 96% yield, 4% defect rate
      const y = computeYield(24, 25);
      const dr = computeDefectRate(1, 25);
      expect(y).toBe(96.0);
      expect(dr).toBe(4.0);
      expect(Number((y + dr).toFixed(2))).toBe(100.0);

      // Boundary: 0 total units
      expect(computeYield(0, 0)).toBe(0);
      expect(computeDefectRate(0, 0)).toBe(0);
    });

    it('computes Fab Throughput velocity per tool hour', () => {
      // 1,200 wafers across 24 hours on 5 tools = 1200 / (24 * 5) = 10 wafers/hr/tool
      expect(computeThroughput(1200, 24, 5)).toBe(10.0);
      expect(computeThroughput(0, 24, 5)).toBe(0.0);
    });

    it('computes Cp and Cpk capability indices against known statistical benchmarks', () => {
      // USL: 415, LSL: 385, mean: 400, sigma: 2.5
      // Cp = (415 - 385) / (6 * 2.5) = 30 / 15 = 2.0
      // Cpk = min((415-400)/(3*2.5), (400-385)/(3*2.5)) = 15 / 7.5 = 2.0 (perfectly centered)
      expect(computeCp(415, 385, 2.5)).toBe(2.0);
      expect(computeCpk(400, 415, 385, 2.5)).toBe(2.0);

      // Shifted mean: mean = 405 (closer to USL)
      // Cpu = (415 - 405) / 7.5 = 10 / 7.5 = 1.333
      // Cpl = (405 - 385) / 7.5 = 20 / 7.5 = 2.667
      // Cpk = 1.333
      expect(computeCpk(405, 415, 385, 2.5)).toBe(1.333);
    });
  });

  describe('Single Source of Truth Consistency (Cards, Tables, and Charts Agreement)', () => {
    it('proves Dashboard KPI cards, health distribution, and yield trend charts never disagree with raw data recomputation', async () => {
      const workspaceId = 'ws_truth_test';

      // 1. Seed known equipment
      await equipmentRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'CVD-01',
        name: 'Centura CVD',
        type: 'deposition_cvd',
        locationBay: 'Bay-01',
        status: 'processing',
        parameters: [],
        sourceType: 'synthetic'
      });

      await equipmentRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'ETCH-01',
        name: 'TCP Etcher',
        type: 'etch',
        locationBay: 'Bay-02',
        status: 'error',
        parameters: [],
        sourceType: 'synthetic'
      });

      await equipmentRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'CMP-01',
        name: 'Ebara Polisher',
        type: 'cmp',
        locationBay: 'Bay-03',
        status: 'idle',
        parameters: [],
        sourceType: 'synthetic'
      });

      // 2. Seed known alerts
      await alertRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'ETCH-01',
        severity: 'critical',
        state: 'open',
        title: 'Pressure Spike Tripwire',
        description: 'Chamber pressure exceeded USL',
        sourceType: 'synthetic'
      });

      // 3. Seed known wafer lots with explicit counts
      await lotRepository.create(workspaceId, {
        workspaceId,
        lotId: 'LOT-TEST-01',
        recipeId: 'REC-01',
        totalUnits: 25,
        goodUnits: 24,
        defectCount: 1,
        yieldPercent: 96.0,
        startTime: new Date('2026-10-10T08:00:00Z'),
        currentStage: 'CVD',
        status: 'completed',
        stages: [],
        sourceType: 'synthetic'
      });

      await lotRepository.create(workspaceId, {
        workspaceId,
        lotId: 'LOT-TEST-02',
        recipeId: 'REC-01',
        totalUnits: 25,
        goodUnits: 20,
        defectCount: 5,
        yieldPercent: 80.0,
        startTime: new Date('2026-10-11T08:00:00Z'),
        currentStage: 'CMP',
        status: 'completed',
        stages: [],
        sourceType: 'synthetic'
      });

      // 4. Fetch the operations overview from the shared metrics service
      const overview = await metricsService.getOperationsOverview(workspaceId, {
        sourceType: 'synthetic',
        days: 7
      });

      // Raw Ground Truth Recomputation:
      // Total equipment = 3
      expect(overview.kpis.totalEquipment).toBe(3);

      // Total tools = healthy (1) + warning (0) + critical (1: ETCH-01 has error status & critical alert) + offline/idle (CMP-01 is healthy) -> healthy = 2, critical = 1
      const totalDistribution =
        overview.healthDistribution.healthy +
        overview.healthDistribution.warning +
        overview.healthDistribution.critical +
        overview.healthDistribution.offline;
      expect(totalDistribution).toBe(overview.kpis.totalEquipment);

      // Active Alerts count matches
      expect(overview.kpis.activeAlerts).toBe(1);

      // Raw Yield Recomputation:
      // Total units = 25 + 25 = 50
      // Good units = 24 + 20 = 44
      // Recomputed Yield = (44 / 50) * 100 = 88.0%
      const recomputedRawYield = computeYield(44, 50);
      expect(recomputedRawYield).toBe(88.0);

      // KPI Card Yield MUST match recomputed yield exactly
      expect(overview.kpis.currentWaferYield).toBe(recomputedRawYield);

      // Chart series total sum MUST match total inspected units and overall yield
      const chartTotalGood = overview.yieldTrend.reduce((sum, day) => sum + day.goodUnits, 0);
      const chartTotalInspected = overview.yieldTrend.reduce((sum, day) => sum + day.totalUnits, 0);
      expect(chartTotalGood).toBe(44);
      expect(chartTotalInspected).toBe(50);

      const chartAggregatedYield = computeYield(chartTotalGood, chartTotalInspected);
      expect(chartAggregatedYield).toBe(overview.kpis.currentWaferYield);

      // Attention Queue items MUST match high risk tools in KPI card
      const criticalInQueue = overview.attentionQueue.filter((item) => item.status === 'error' || item.riskScore > 70);
      expect(criticalInQueue.length).toBe(overview.kpis.highRiskEquipment);
      expect(criticalInQueue[0].equipmentId).toBe('ETCH-01');
    });
  });
});
