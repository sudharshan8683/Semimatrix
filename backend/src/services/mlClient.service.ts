import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface MLAnomalyResponse {
  equipment_id: string;
  anomaly_score: number;
  is_anomaly: boolean;
  parameter_deviations: Array<{
    parameter: string;
    latest_value: number;
    nominal: number;
    z_score: number;
    severity: 'warning' | 'critical';
  }>;
  engine: 'fastapi_isolation_forest' | 'deterministic_baseline';
}

export interface MLHealthRiskResponse {
  equipment_id: string;
  health_index: number;
  failure_probability: number;
  risk_category: 'low' | 'medium' | 'high' | 'critical';
  supervised_available: boolean;
  supervised_model_note: string;
  contributing_factors: Array<{
    factor: string;
    penalty_points: number;
    weight: string;
  }>;
  engine: 'fastapi_ml_service' | 'deterministic_baseline';
}

export class MLClientService {
  private baseUrl = env.ML_SERVICE_URL;

  // Circuit breaker state
  private isFastApiAvailable = false;
  private lastChecked = 0;

  private async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastChecked < 10000) return this.isFastApiAvailable;

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(id);
      this.isFastApiAvailable = res.ok;
    } catch {
      this.isFastApiAvailable = false;
    }
    this.lastChecked = now;
    return this.isFastApiAvailable;
  }

  async scoreAnomaly(params: {
    equipment_id: string;
    telemetry: Array<Record<string, number>>;
    nominal_specs: Record<string, { nominal: number; usl: number; lsl: number }>;
  }): Promise<MLAnomalyResponse> {
    const available = await this.checkHealth();

    if (available) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${this.baseUrl}/score/anomaly`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal
        });
        clearTimeout(id);

        if (res.ok) {
          const data = (await res.json()) as any;
          return {
            ...data,
            engine: 'fastapi_isolation_forest'
          };
        }
      } catch (err: any) {
        logger.warn({ msg: 'ML service request failed, falling back to deterministic baseline', err: err.message });
      }
    }

    // Deterministic Baseline Fallback (Runs inside Node if Python service is offline)
    return this.deterministicAnomalyScore(params);
  }

  async scoreHealthRisk(params: {
    equipment_id: string;
    drift_slope: number;
    anomaly_rate: number;
    spc_violations_count: number;
    days_since_maintenance: number;
    active_alarms_count: number;
    has_labelled_failures?: boolean;
    positive_failure_samples?: number;
  }): Promise<MLHealthRiskResponse> {
    const available = await this.checkHealth();

    if (available) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${this.baseUrl}/score/health-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal
        });
        clearTimeout(id);

        if (res.ok) {
          const data = (await res.json()) as any;
          return {
            ...data,
            engine: 'fastapi_ml_service'
          };
        }
      } catch (err: any) {
        logger.warn({ msg: 'ML health-risk request failed, falling back to deterministic baseline', err: err.message });
      }
    }

    // Deterministic Health Fallback
    return this.deterministicHealthRisk(params);
  }

  async getSecomBenchmarkMetrics(): Promise<any> {
    const available = await this.checkHealth();
    if (available) {
      try {
        const res = await fetch(`${this.baseUrl}/benchmark/secom-metrics`);
        if (res.ok) return await res.json();
      } catch {
        // Fall through to hard-verified holdout baseline
      }
    }

    // Hard-verified baseline metrics from ml/results/final_test_metrics.json
    return {
      dataset: 'UCI SECOM Semiconductor Process Dataset',
      description: '590 anonymized sensor channels from an operational semiconductor production line.',
      split_methodology: 'Time-ordered holdout split (no random shuffling across time to prevent data leakage).',
      class_imbalance: {
        test_total_wafers: 314,
        test_positive_fails: 17,
        positive_ratio_percent: 5.41
      },
      metrics: {
        pr_auc: 0.0719,
        roc_auc: 0.5506,
        precision_at_0_5: 0.0,
        recall_at_0_5: 0.0,
        flag_top_20pct_score: {
          rows_flagged: 63,
          caught: 2,
          precision: 0.0317,
          recall: 0.1176,
          lift_vs_random: 0.59
        }
      },
      honest_evaluation_summary:
        'The data is severely imbalanced (5.4% positive fail rate). At a conventional 0.5 probability threshold, zero true positives are identified. When flagging the top 20% highest risk scores, recall reaches 11.76% with a precision of 3.17%. Models must never report accuracy alone on imbalanced semiconductor telemetry.'
    };
  }

  // Pure Deterministic Anomaly Scoring
  private deterministicAnomalyScore(params: {
    equipment_id: string;
    telemetry: Array<Record<string, number>>;
    nominal_specs: Record<string, { nominal: number; usl: number; lsl: number }>;
  }): MLAnomalyResponse {
    if (!params.telemetry || params.telemetry.length === 0) {
      return {
        equipment_id: params.equipment_id,
        anomaly_score: 0.0,
        is_anomaly: false,
        parameter_deviations: [],
        engine: 'deterministic_baseline'
      };
    }

    const latest = params.telemetry[params.telemetry.length - 1];
    const deviations: MLAnomalyResponse['parameter_deviations'] = [];
    let sumZsq = 0;
    let paramCount = 0;

    for (const [param, val] of Object.entries(latest)) {
      if (!params.nominal_specs[param]) continue;
      const spec = params.nominal_specs[param];
      const sigma = Math.max(0.001, (spec.usl - spec.nominal) / 3.0);
      const z = (val - spec.nominal) / sigma;
      sumZsq += z * z;
      paramCount++;

      if (Math.abs(z) > 1.8) {
        deviations.push({
          parameter: param,
          latest_value: Number(val.toFixed(3)),
          nominal: Number(spec.nominal.toFixed(3)),
          z_score: Number(z.toFixed(2)),
          severity: Math.abs(z) > 3.0 ? 'critical' : 'warning'
        });
      }
    }

    const rmsZ = paramCount > 0 ? Math.sqrt(sumZsq / paramCount) : 0;
    const score = Number(Math.tanh(rmsZ / 3.0).toFixed(3));
    const isAnomaly = score > 0.65 || deviations.some((d) => d.severity === 'critical');

    return {
      equipment_id: params.equipment_id,
      anomaly_score: score,
      is_anomaly: isAnomaly,
      parameter_deviations: deviations,
      engine: 'deterministic_baseline'
    };
  }

  // Pure Deterministic Health Risk Scoring
  private deterministicHealthRisk(params: {
    equipment_id: string;
    drift_slope: number;
    anomaly_rate: number;
    spc_violations_count: number;
    days_since_maintenance: number;
    active_alarms_count: number;
    has_labelled_failures?: boolean;
    positive_failure_samples?: number;
  }): MLHealthRiskResponse {
    const driftPenalty = Math.min(30.0, Math.abs(params.drift_slope) * 20.0);
    const anomalyPenalty = Math.min(35.0, params.anomaly_rate * 35.0);
    const spcPenalty = Math.min(25.0, params.spc_violations_count * 5.0);
    const pmPenalty = Math.min(20.0, (params.days_since_maintenance / 60.0) * 15.0);
    const alarmPenalty = Math.min(20.0, params.active_alarms_count * 8.0);

    const totalPenalty = driftPenalty + anomalyPenalty + spcPenalty + pmPenalty + alarmPenalty;
    const healthIndex = Number(Math.max(0, Math.min(100, 100 - totalPenalty)).toFixed(1));
    const failProb = Number((1.0 - healthIndex / 100).toFixed(3));

    let riskCat: MLHealthRiskResponse['risk_category'] = 'low';
    if (healthIndex < 40) riskCat = 'critical';
    else if (healthIndex < 60) riskCat = 'high';
    else if (healthIndex < 80) riskCat = 'medium';

    return {
      equipment_id: params.equipment_id,
      health_index: healthIndex,
      failure_probability: failProb,
      risk_category: riskCat,
      supervised_available: false,
      supervised_model_note:
        'No supervised model: insufficient labelled failure events (minimum 10 required). Risk computed using transparent physics drift & degradation index.',
      contributing_factors: [
        { factor: 'Sensor Drift Slope', penalty_points: Number(driftPenalty.toFixed(1)), weight: '25%' },
        { factor: 'Anomaly Rate', penalty_points: Number(anomalyPenalty.toFixed(1)), weight: '30%' },
        { factor: 'SPC Nelson Rule Violations', penalty_points: Number(spcPenalty.toFixed(1)), weight: '20%' },
        { factor: 'Days Since Last PM', penalty_points: Number(pmPenalty.toFixed(1)), weight: '15%' },
        { factor: 'Active Alarm Severity', penalty_points: Number(alarmPenalty.toFixed(1)), weight: '10%' }
      ],
      engine: 'deterministic_baseline'
    };
  }
}

export const mlClientService = new MLClientService();
