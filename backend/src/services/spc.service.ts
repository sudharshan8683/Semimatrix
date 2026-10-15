import { computeCp, computeCpk } from '../metrics/calculations.js';

export interface SPCPoint {
  timestamp: string;
  value: number;
  lotId?: string;
}

export interface RuleViolation {
  rule: 'Rule 1' | 'Rule 2' | 'Rule 3' | 'Rule 4';
  ruleName: string;
  description: string;
  pointIndex: number;
  timestamp: string;
  value: number;
}

export interface SPCAnalysisResult {
  parameterName: string;
  unit: string;
  baseline: {
    pointCount: number;
    mean: number;
    mrMean: number;
    sigma: number;
    ucl: number;
    lcl: number;
    cl: number;
  };
  specLimits?: {
    usl: number;
    lsl: number;
    cp: number | null;
    cpk: number | null;
  };
  points: Array<{
    timestamp: string;
    value: number;
    ucl: number;
    lcl: number;
    cl: number;
    isOutOfControl: boolean;
    violations: string[];
  }>;
  violationsSummary: RuleViolation[];
  outOfControlCount: number;
}

export class SPCService {
  /**
   * Computes Phase I Baseline Control Limits using Individuals and Moving Range (I-MR)
   * d2 constant for sample size n=2 is 1.128
   */
  computeBaselineLimits(values: number[]): {
    mean: number;
    mrMean: number;
    sigma: number;
    ucl: number;
    lcl: number;
    cl: number;
  } {
    if (values.length < 2) {
      const fallbackMean = values[0] ?? 0;
      return {
        mean: fallbackMean,
        mrMean: 0,
        sigma: 0,
        ucl: fallbackMean,
        lcl: fallbackMean,
        cl: fallbackMean
      };
    }

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    let mrSum = 0;
    for (let i = 1; i < values.length; i++) {
      mrSum += Math.abs(values[i] - values[i - 1]);
    }
    const mrMean = mrSum / (values.length - 1);
    const sigma = mrMean / 1.128; // d2 for n=2

    const ucl = Number((mean + 3 * sigma).toFixed(3));
    const lcl = Number((mean - 3 * sigma).toFixed(3));
    const cl = Number(mean.toFixed(3));

    return {
      mean: Number(mean.toFixed(3)),
      mrMean: Number(mrMean.toFixed(3)),
      sigma: Number(sigma.toFixed(3)),
      ucl,
      lcl,
      cl
    };
  }

  /**
   * Evaluates Western Electric / Nelson Rules:
   * Rule 1: 1 point > 3 sigma beyond centerline (out of UCL/LCL)
   * Rule 2: 9 consecutive points on the same side of the centerline
   * Rule 3: 6 consecutive points steadily increasing or steadily decreasing
   * Rule 4: 14 consecutive points alternating up and down
   */
  evaluateNelsonRules(
    points: SPCPoint[],
    controlLimits: { ucl: number; lcl: number; cl: number; sigma: number }
  ): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const values = points.map((p) => p.value);
    const { ucl, lcl, cl } = controlLimits;

    for (let i = 0; i < values.length; i++) {
      const val = values[i];
      const pt = points[i];

      // Rule 1: Beyond 3 sigma (outside UCL / LCL)
      if (val > ucl || val < lcl) {
        violations.push({
          rule: 'Rule 1',
          ruleName: 'Single Point Beyond 3-Sigma',
          description: `Point ${val} falls outside control limits [${lcl}, ${ucl}].`,
          pointIndex: i,
          timestamp: pt.timestamp,
          value: val
        });
      }

      // Rule 2: 9 consecutive points on same side of centerline
      if (i >= 8) {
        const last9 = values.slice(i - 8, i + 1);
        const allAbove = last9.every((v) => v > cl);
        const allBelow = last9.every((v) => v < cl);
        if (allAbove || allBelow) {
          violations.push({
            rule: 'Rule 2',
            ruleName: '9 Consecutive Points on One Side of Centerline',
            description: `Nine consecutive points fell strictly ${allAbove ? 'above' : 'below'} centerline (${cl}).`,
            pointIndex: i,
            timestamp: pt.timestamp,
            value: val
          });
        }
      }

      // Rule 3: 6 consecutive points steadily increasing or decreasing
      if (i >= 5) {
        const last6 = values.slice(i - 5, i + 1);
        let strictlyIncreasing = true;
        let strictlyDecreasing = true;
        for (let j = 1; j < 6; j++) {
          if (last6[j] <= last6[j - 1]) strictlyIncreasing = false;
          if (last6[j] >= last6[j - 1]) strictlyDecreasing = false;
        }
        if (strictlyIncreasing || strictlyDecreasing) {
          violations.push({
            rule: 'Rule 3',
            ruleName: '6 Consecutive Points Steadily Increasing or Decreasing',
            description: `Six consecutive points showed monotonic ${strictlyIncreasing ? 'increasing drift' : 'decreasing drift'}.`,
            pointIndex: i,
            timestamp: pt.timestamp,
            value: val
          });
        }
      }

      // Rule 4: 14 consecutive points alternating up and down
      if (i >= 13) {
        const last14 = values.slice(i - 13, i + 1);
        let alternating = true;
        for (let j = 1; j < 13; j++) {
          const diffPrev = last14[j] - last14[j - 1];
          const diffNext = last14[j + 1] - last14[j];
          if ((diffPrev > 0 && diffNext > 0) || (diffPrev < 0 && diffNext < 0)) {
            alternating = false;
            break;
          }
        }
        if (alternating) {
          violations.push({
            rule: 'Rule 4',
            ruleName: '14 Consecutive Points Alternating Up and Down',
            description: 'Fourteen consecutive points oscillated direction continuously (systematic mixture or over-control).',
            pointIndex: i,
            timestamp: pt.timestamp,
            value: val
          });
        }
      }
    }

    return violations;
  }

  /**
   * Run full SPC Analysis on an equipment parameter series
   * Baseline window is selectable (e.g. first N points or a separate Phase I slice)
   */
  analyzeSeries(
    points: SPCPoint[],
    parameterName: string,
    unit: string,
    options: {
      baselineCount?: number;
      usl?: number;
      lsl?: number;
    } = {}
  ): SPCAnalysisResult {
    if (points.length === 0) {
      return {
        parameterName,
        unit,
        baseline: { pointCount: 0, mean: 0, mrMean: 0, sigma: 0, ucl: 0, lcl: 0, cl: 0 },
        points: [],
        violationsSummary: [],
        outOfControlCount: 0
      };
    }

    // Determine Phase I baseline window:
    // Uses first baselineCount points (default 25 or 30% of data, min 10 points if available)
    const baselineN = Math.max(
      2,
      Math.min(points.length, options.baselineCount ?? Math.max(10, Math.floor(points.length * 0.35)))
    );

    const baselineSlice = points.slice(0, baselineN).map((p) => p.value);
    const limits = this.computeBaselineLimits(baselineSlice);

    // Evaluate Nelson rules against all points using Phase I limits
    const violations = this.evaluateNelsonRules(points, limits);

    // Group violations per point index
    const violationMap = new Map<number, string[]>();
    for (const v of violations) {
      const list = violationMap.get(v.pointIndex) || [];
      list.push(`${v.rule}: ${v.ruleName}`);
      violationMap.set(v.pointIndex, list);
    }

    // Process capability indices if USL and LSL are provided
    let specLimits;
    if (options.usl !== undefined && options.lsl !== undefined && limits.sigma > 0) {
      specLimits = {
        usl: options.usl,
        lsl: options.lsl,
        cp: computeCp(options.usl, options.lsl, limits.sigma),
        cpk: computeCpk(limits.mean, options.usl, options.lsl, limits.sigma)
      };
    }

    const annotatedPoints = points.map((p, idx) => {
      const pointViolations = violationMap.get(idx) || [];
      return {
        timestamp: p.timestamp,
        value: p.value,
        ucl: limits.ucl,
        lcl: limits.lcl,
        cl: limits.cl,
        isOutOfControl: pointViolations.length > 0,
        violations: pointViolations
      };
    });

    return {
      parameterName,
      unit,
      baseline: {
        pointCount: baselineN,
        ...limits
      },
      specLimits,
      points: annotatedPoints,
      violationsSummary: violations,
      outOfControlCount: violations.length
    };
  }
}

export const spcService = new SPCService();
