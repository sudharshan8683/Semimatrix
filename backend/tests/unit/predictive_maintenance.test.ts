import { describe, it, expect, beforeEach } from 'vitest';
import { predictiveMaintenanceService } from '../../src/services/predictiveMaintenance.service.js';
import { mlClientService } from '../../src/services/mlClient.service.js';
import { InMemoryStore } from '../../src/repositories/base.repository.js';
import { equipmentRepository } from '../../src/repositories/equipment.repository.js';
import { injectedEventRepository } from '../../src/repositories/injectedEvent.repository.js';
import { alertRepository } from '../../src/repositories/alert.repository.js';

describe('Stage 6: Predictive Maintenance, Health Risk & Detection Scorecard', () => {
  beforeEach(() => {
    InMemoryStore.getInstance().clearAll();
  });

  it('computes transparent equipment health indices and falls back gracefully to deterministic scoring', async () => {
    const risk = await mlClientService.scoreHealthRisk({
      equipment_id: 'ETCH-01',
      drift_slope: 0.25,
      anomaly_rate: 0.1,
      spc_violations_count: 1,
      days_since_maintenance: 15,
      active_alarms_count: 1
    });

    // Health index between 0 and 100
    expect(risk.health_index).toBeGreaterThan(60);
    expect(risk.health_index).toBeLessThanOrEqual(100);
    expect(risk.failure_probability).toBeCloseTo(1 - risk.health_index / 100, 2);

    // When insufficient positive failure events, supervised ML must state "no supervised model"
    expect(risk.supervised_available).toBe(false);
    expect(risk.supervised_model_note).toMatch(/no supervised model: insufficient labelled failure events/i);
    expect(risk.contributing_factors.length).toBeGreaterThan(0);
  });

  it('computes synthetic detection scorecard against injected ground truth (Criterion 7)', async () => {
    const workspaceId = 'ws_scorecard_test';

    // 1. Seed equipment (1 critical, 1 healthy)
    await equipmentRepository.create(workspaceId, {
      workspaceId,
      equipmentId: 'DEPO-01',
      name: 'Centura CVD',
      type: 'deposition_cvd',
      locationBay: 'Bay-01',
      status: 'error',
      parameters: [{ name: 'temperature', unit: 'degC', nominal: 400, usl: 415, lsl: 385, rangeMin: 300, rangeMax: 500 }],
      sourceType: 'synthetic'
    });

    await equipmentRepository.create(workspaceId, {
      workspaceId,
      equipmentId: 'ETCH-01',
      name: 'TCP Etch',
      type: 'etch',
      locationBay: 'Bay-02',
      status: 'idle',
      parameters: [{ name: 'pressure', unit: 'mTorr', nominal: 45, usl: 52, lsl: 38, rangeMin: 20, rangeMax: 70 }],
      sourceType: 'synthetic'
    });

    // 2. Seed critical alert for DEPO-01
    await alertRepository.create(workspaceId, {
      workspaceId,
      equipmentId: 'DEPO-01',
      severity: 'critical',
      state: 'open',
      title: 'Thermal Drift Injected Anomaly',
      description: 'Temperature exceeded UCL for 6 points',
      sourceType: 'synthetic'
    });

    // 3. Seed Injected Ground Truth for DEPO-01
    await injectedEventRepository.create(workspaceId, {
      workspaceId,
      equipmentId: 'DEPO-01',
      eventType: 'gradual_drift',
      description: 'Simulated heater oxidation',
      startTime: new Date(),
      endTime: new Date(),
      affectedParameters: ['temperature'],
      severity: 'high',
      expectedLeadTimeHours: 24,
      isDetected: true
    });

    // 4. Run fleet overview
    const overview = await predictiveMaintenanceService.getFleetMaintenanceOverview(workspaceId, {
      sourceType: 'synthetic'
    });

    expect(overview.fleetRiskCards.length).toBe(2);
    expect(overview.detectionScorecard).toBeDefined();

    const sc = overview.detectionScorecard!;
    expect(sc.isSyntheticOnly).toBe(true);
    expect(sc.totalInjectedEvents).toBe(1);
    expect(sc.truePositivesDetected).toBe(1);
    expect(sc.precision).toBe(1.0);
    expect(sc.recall).toBe(1.0);
    expect(sc.meanLeadTimeHours).toBe(24.0);
    expect(sc.scientificLimitationNotice).toMatch(/evaluated strictly against synthetic injected ground truth/i);
    expect(overview.advisoryDisclaimer).toMatch(/advisory decision-support system/i);
  });
});
