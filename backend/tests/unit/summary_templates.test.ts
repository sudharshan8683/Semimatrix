import { describe, it, expect } from 'vitest';
import { summaryTemplates } from '../../src/utils/summaryTemplates.js';

describe('Stage 4: Deterministic Plain-Language Summary Templates', () => {
  it('generates an alert summary adhering strictly to non-causal language', () => {
    const summary = summaryTemplates.alert({
      equipmentId: 'ETCH-02',
      parameterName: 'chamber_pressure',
      actualValue: 53.8,
      thresholdValue: 52.0,
      unit: 'mTorr',
      ruleViolated: 'Nelson Rule 1'
    });

    expect(summary).toContain('ETCH-02');
    expect(summary).toContain('53.80 mTorr');
    expect(summary).toContain('52.00 mTorr');
    expect(summary).toContain('Nelson Rule 1');
    expect(summary.toLowerCase()).not.toContain('root cause confirmed');
    expect(summary.toLowerCase()).not.toContain('proven to have caused');
  });

  it('generates a drift summary showing direction, rate, and non-causal association', () => {
    const summary = summaryTemplates.drift({
      equipmentId: 'DEPO-01',
      parameterName: 'temperature',
      driftRatePerHour: 0.25,
      durationHours: 48,
      currentValue: 409.8,
      unit: 'degC'
    });

    expect(summary).toContain('DEPO-01');
    expect(summary).toContain('temperature');
    expect(summary).toContain('drifting upward');
    expect(summary).toContain('0.25 degC/hr');
    expect(summary).toContain('48 hours');
    expect(summary).toContain('associated with');
  });

  it('generates a yield excursion summary with exact scrap counts and upstream contrast', () => {
    const summary = summaryTemplates.yieldExcursion({
      lotId: 'LOT-2610-08',
      equipmentId: 'CMP-01',
      yieldPercent: 64.0,
      scrapCount: 9,
      totalWafers: 25,
      stageName: 'CMP Polishing'
    });

    expect(summary).toContain('LOT-2610-08');
    expect(summary).toContain('36.0% yield loss');
    expect(summary).toContain('9 of 25 wafers scrapped');
    expect(summary).toContain('CMP-01');
    expect(summary).toContain('associated with');
    expect(summary).toContain('Upstream process stages showed normal yield');
  });

  it('generates an investigation candidate summary with effect size and candidate wording', () => {
    const summary = summaryTemplates.investigationCandidate({
      factorName: 'Slurry flow rate drop',
      equipmentId: 'CMP-01',
      parameterName: 'slurry_flow',
      effectSize: 2.84,
      sampleSize: 25
    });

    expect(summary).toContain('Slurry flow rate drop');
    expect(summary).toContain('CMP-01');
    expect(summary).toContain('d = 2.84');
    expect(summary).toContain('25 samples');
    expect(summary).toContain('candidate contributor');
    expect(summary.toLowerCase()).not.toContain('root cause confirmed');
  });

  it('generates a maintenance risk summary with urgency categorization', () => {
    const summary = summaryTemplates.maintenanceRisk({
      equipmentId: 'CMP-01',
      riskScore: 78,
      primaryFactor: 'slurry delivery flow rate drop'
    });

    expect(summary).toContain('CMP-01');
    expect(summary).toContain('urgent degradation risk');
    expect(summary).toContain('78%');
    expect(summary).toContain('slurry delivery flow rate drop');
  });
});
