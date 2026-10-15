import { describe, it, expect } from 'vitest';
import { spcService, SPCPoint } from '../../src/services/spc.service.js';

describe('Stage 4: Statistical Process Control (SPC) & Nelson Rules', () => {
  it('computes Phase I baseline control limits strictly from the baseline slice (Criterion 6)', () => {
    // 10 baseline points with nominal = 100, plus 5 subsequent out-of-control points
    const points: SPCPoint[] = [
      // Phase I Baseline Window (10 points, stable)
      { timestamp: 'T01', value: 99.8 },
      { timestamp: 'T02', value: 100.2 },
      { timestamp: 'T03', value: 100.1 },
      { timestamp: 'T04', value: 99.9 },
      { timestamp: 'T05', value: 100.0 },
      { timestamp: 'T06', value: 100.3 },
      { timestamp: 'T07', value: 99.7 },
      { timestamp: 'T08', value: 100.1 },
      { timestamp: 'T09', value: 100.0 },
      { timestamp: 'T10', value: 99.9 },
      // Phase II Judged Points (drifting/spiking)
      { timestamp: 'T11', value: 105.0 },
      { timestamp: 'T12', value: 106.0 },
      { timestamp: 'T13', value: 107.0 }
    ];

    const result = spcService.analyzeSeries(points, 'temperature', 'degC', {
      baselineCount: 10,
      usl: 110.0,
      lsl: 90.0
    });

    // Baseline point count must be exactly 10
    expect(result.baseline.pointCount).toBe(10);
    // Centerline must be based on the first 10 points (~100.0)
    expect(result.baseline.cl).toBeCloseTo(100.0, 1);
    // Control limits must be based on baseline sigma, NOT inflated by the T11-T13 excursions
    expect(result.baseline.ucl).toBeLessThan(102.0);
    expect(result.baseline.lcl).toBeGreaterThan(98.0);
  });

  it('detects Nelson Rule 1 (Single point beyond 3-sigma limits)', () => {
    const limits = { ucl: 105.0, lcl: 95.0, cl: 100.0, sigma: 1.66 };
    const points: SPCPoint[] = [
      { timestamp: 'T1', value: 100.0 },
      { timestamp: 'T2', value: 101.2 },
      { timestamp: 'T3', value: 106.5 } // Beyond UCL (105.0)
    ];

    const violations = spcService.evaluateNelsonRules(points, limits);
    const rule1 = violations.find((v) => v.rule === 'Rule 1');
    expect(rule1).toBeDefined();
    expect(rule1?.pointIndex).toBe(2);
    expect(rule1?.value).toBe(106.5);
  });

  it('detects Nelson Rule 2 (9 consecutive points on one side of centerline)', () => {
    const limits = { ucl: 110.0, lcl: 90.0, cl: 100.0, sigma: 3.33 };
    const points: SPCPoint[] = [
      { timestamp: 'T1', value: 101.0 },
      { timestamp: 'T2', value: 101.5 },
      { timestamp: 'T3', value: 102.0 },
      { timestamp: 'T4', value: 100.5 },
      { timestamp: 'T5', value: 101.2 },
      { timestamp: 'T6', value: 102.3 },
      { timestamp: 'T7', value: 101.8 },
      { timestamp: 'T8', value: 100.9 },
      { timestamp: 'T9', value: 101.1 } // 9th consecutive point > CL (100.0)
    ];

    const violations = spcService.evaluateNelsonRules(points, limits);
    const rule2 = violations.find((v) => v.rule === 'Rule 2');
    expect(rule2).toBeDefined();
    expect(rule2?.pointIndex).toBe(8);
  });

  it('detects Nelson Rule 3 (6 consecutive points steadily increasing or decreasing)', () => {
    const limits = { ucl: 120.0, lcl: 80.0, cl: 100.0, sigma: 6.66 };
    const points: SPCPoint[] = [
      { timestamp: 'T1', value: 95.0 },
      { timestamp: 'T2', value: 96.0 },
      { timestamp: 'T3', value: 97.2 },
      { timestamp: 'T4', value: 98.5 },
      { timestamp: 'T5', value: 100.1 },
      { timestamp: 'T6', value: 101.4 } // 6 consecutive increasing points
    ];

    const violations = spcService.evaluateNelsonRules(points, limits);
    const rule3 = violations.find((v) => v.rule === 'Rule 3');
    expect(rule3).toBeDefined();
    expect(rule3?.pointIndex).toBe(5);
  });

  it('detects Nelson Rule 4 (14 consecutive points alternating up and down)', () => {
    const limits = { ucl: 120.0, lcl: 80.0, cl: 100.0, sigma: 6.66 };
    const points: SPCPoint[] = [];
    let current = 100;
    for (let i = 0; i < 14; i++) {
      current += i % 2 === 0 ? 2 : -2;
      points.push({ timestamp: `T${i + 1}`, value: current });
    }

    const violations = spcService.evaluateNelsonRules(points, limits);
    const rule4 = violations.find((v) => v.rule === 'Rule 4');
    expect(rule4).toBeDefined();
    expect(rule4?.pointIndex).toBe(13);
  });

  it('computes Cp and Cpk capability indices when specification limits exist', () => {
    // 10 identical points centered at 100
    const points: SPCPoint[] = [
      { timestamp: 'T1', value: 98 },
      { timestamp: 'T2', value: 102 },
      { timestamp: 'T3', value: 99 },
      { timestamp: 'T4', value: 101 },
      { timestamp: 'T5', value: 100 },
      { timestamp: 'T6', value: 100 },
      { timestamp: 'T7', value: 99 },
      { timestamp: 'T8', value: 101 },
      { timestamp: 'T9', value: 102 },
      { timestamp: 'T10', value: 98 }
    ];

    const result = spcService.analyzeSeries(points, 'temperature', 'degC', {
      usl: 115,
      lsl: 85
    });

    expect(result.specLimits).toBeDefined();
    expect(result.specLimits?.usl).toBe(115);
    expect(result.specLimits?.lsl).toBe(85);
    expect(result.specLimits?.cp).toBeGreaterThan(1.0);
    expect(result.specLimits?.cpk).toBeGreaterThan(1.0);
  });
});
