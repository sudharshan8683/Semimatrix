import { describe, it, expect, beforeEach } from 'vitest';
import { syntheticGeneratorService } from '../../src/services/syntheticGenerator.service.js';
import { InMemoryStore } from '../../src/repositories/base.repository.js';
import { injectedEventRepository } from '../../src/repositories/injectedEvent.repository.js';

describe('Stage 2: Synthetic Generator & Injected Ground Truth', () => {
  beforeEach(() => {
    InMemoryStore.getInstance().clearAll();
  });

  it('generates deterministic fab telemetry by seed with realistic tools and injected anomalies', async () => {
    const workspaceId = 'ws_synth_test_123';

    const result = await syntheticGeneratorService.generateAndPersist(workspaceId, {
      seed: 42,
      days: 3,
      toolCountPerType: 2
    });

    // 5 types x 2 tools = 10 tools
    expect(result.equipmentCount).toBe(10);
    expect(result.readingCount).toBeGreaterThan(500);
    expect(result.lotCount).toBe(28);
    expect(result.injectedEventCount).toBe(3);

    // Verify Injected Ground Truth exists in dedicated collection
    const groundTruthEvents = await injectedEventRepository.find(workspaceId);
    expect(groundTruthEvents.length).toBe(3);

    const driftEvent = groundTruthEvents.find((e) => e.eventType === 'gradual_drift');
    expect(driftEvent).toBeDefined();
    expect(driftEvent?.equipmentId).toBe('DEPO-01');
    expect(driftEvent?.affectedParameters).toContain('temperature');

    const spikeEvent = groundTruthEvents.find((e) => e.eventType === 'sudden_spike');
    expect(spikeEvent).toBeDefined();
    expect(spikeEvent?.equipmentId).toBe('ETCH-02');

    const excursionEvent = groundTruthEvents.find((e) => e.eventType === 'contamination_yield_excursion');
    expect(excursionEvent).toBeDefined();
    expect(excursionEvent?.lotId).toBe('LOT-2610-08');

    // CSV header must label data as synthetic with reproducible seed
    expect(result.csvContent).toMatch(/# SOURCE_TYPE: synthetic/i);
    expect(result.csvContent).toMatch(/REPRODUCIBLE_SEED: 42/i);
  });
});
