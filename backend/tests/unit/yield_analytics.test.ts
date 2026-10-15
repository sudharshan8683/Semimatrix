import { describe, it, expect, beforeEach } from 'vitest';
import { yieldService } from '../../src/services/yield.service.js';
import { InMemoryStore } from '../../src/repositories/base.repository.js';
import { lotRepository } from '../../src/repositories/lot.repository.js';

describe('Stage 5: Lots, Stage Traceability & Tool Yield Correlation', () => {
  beforeEach(() => {
    InMemoryStore.getInstance().clearAll();
  });

  it('aggregates stage yield and detects outlier tools associated with yield loss', async () => {
    const workspaceId = 'ws_yield_test';

    // Seed 3 lots: Lot 1 & 2 normal (24/25 = 96%), Lot 3 excursion on CMP-01 (15/25 = 60%)
    await lotRepository.create(workspaceId, {
      workspaceId,
      lotId: 'LOT-NORM-01',
      recipeId: 'RECIPE-A',
      totalUnits: 25,
      goodUnits: 24,
      defectCount: 1,
      yieldPercent: 96.0,
      startTime: new Date('2026-10-10T08:00:00Z'),
      currentStage: 'CMP',
      status: 'completed',
      stages: [
        { stage: 'CVD Dielectric Deposition', equipmentId: 'DEPO-01', startTime: new Date(), endTime: new Date(), status: 'passed', defectsDetected: 0 },
        { stage: 'Chemical Mechanical Polishing', equipmentId: 'CMP-02', startTime: new Date(), endTime: new Date(), status: 'passed', defectsDetected: 1 }
      ],
      sourceType: 'synthetic'
    });

    await lotRepository.create(workspaceId, {
      workspaceId,
      lotId: 'LOT-NORM-02',
      recipeId: 'RECIPE-A',
      totalUnits: 25,
      goodUnits: 25,
      defectCount: 0,
      yieldPercent: 100.0,
      startTime: new Date('2026-10-11T08:00:00Z'),
      currentStage: 'CMP',
      status: 'completed',
      stages: [
        { stage: 'CVD Dielectric Deposition', equipmentId: 'DEPO-01', startTime: new Date(), endTime: new Date(), status: 'passed', defectsDetected: 0 },
        { stage: 'Chemical Mechanical Polishing', equipmentId: 'CMP-02', startTime: new Date(), endTime: new Date(), status: 'passed', defectsDetected: 0 }
      ],
      sourceType: 'synthetic'
    });

    await lotRepository.create(workspaceId, {
      workspaceId,
      lotId: 'LOT-EXCURSION-03',
      recipeId: 'RECIPE-A',
      totalUnits: 25,
      goodUnits: 15,
      defectCount: 10,
      yieldPercent: 60.0,
      startTime: new Date('2026-10-12T08:00:00Z'),
      currentStage: 'CMP',
      status: 'scrapped',
      stages: [
        { stage: 'CVD Dielectric Deposition', equipmentId: 'DEPO-01', startTime: new Date(), endTime: new Date(), status: 'passed', defectsDetected: 1 },
        { stage: 'Chemical Mechanical Polishing', equipmentId: 'CMP-01', startTime: new Date(), endTime: new Date(), status: 'failed', defectsDetected: 9 }
      ],
      sourceType: 'synthetic'
    });

    // 1. Stage-by-Stage Breakdown
    const stageBreakdown = await yieldService.getYieldByStage(workspaceId, { sourceType: 'synthetic' });
    expect(stageBreakdown.length).toBe(2);

    const cmpStage = stageBreakdown.find((s) => s.stage === 'Chemical Mechanical Polishing');
    expect(cmpStage).toBeDefined();
    // Total CMP defects = 1 + 0 + 9 = 10
    expect(cmpStage?.defectsDetected).toBe(10);
    expect(cmpStage?.totalUnitsProcessed).toBe(75);

    // 2. Tool-to-Yield Correlation
    const toolBreakdown = await yieldService.getYieldByTool(workspaceId, { sourceType: 'synthetic' });
    expect(toolBreakdown.length).toBe(3); // DEPO-01, CMP-02, CMP-01

    // CMP-01 processed only the excursion lot (15 good / 25 total = 60.0% yield)
    const cmp01 = toolBreakdown.find((t) => t.equipmentId === 'CMP-01');
    expect(cmp01).toBeDefined();
    expect(cmp01?.meanYield).toBe(60.0);
    // CMP-01 must be flagged as statistical outlier
    expect(cmp01?.isOutlier).toBe(true);

    // CMP-02 processed normal lots (49 good / 50 total = 98.0% yield)
    const cmp02 = toolBreakdown.find((t) => t.equipmentId === 'CMP-02');
    expect(cmp02).toBeDefined();
    expect(cmp02?.meanYield).toBe(98.0);
    expect(cmp02?.isOutlier).toBe(false);
  });

  it('retrieves detailed lot traceability with chronological stage progression', async () => {
    const workspaceId = 'ws_trace_test';
    const lot = await lotRepository.create(workspaceId, {
      workspaceId,
      lotId: 'LOT-TRACE-01',
      recipeId: 'RECIPE-TRACE',
      totalUnits: 25,
      goodUnits: 24,
      defectCount: 1,
      yieldPercent: 96.0,
      startTime: new Date('2026-10-10T08:00:00Z'),
      currentStage: 'CMP',
      status: 'completed',
      stages: [
        { stage: 'CVD', equipmentId: 'DEPO-01', startTime: new Date(), endTime: new Date(), status: 'passed' },
        { stage: 'Litho', equipmentId: 'LITHO-01', startTime: new Date(), endTime: new Date(), status: 'passed' }
      ],
      sourceType: 'synthetic'
    });

    const found = await yieldService.getLotTraceability(workspaceId, 'LOT-TRACE-01');
    expect(found).not.toBeNull();
    expect(found?.lotId).toBe('LOT-TRACE-01');
    expect(found?.stages.length).toBe(2);
    expect(found?.stages[0].equipmentId).toBe('DEPO-01');
  });
});
