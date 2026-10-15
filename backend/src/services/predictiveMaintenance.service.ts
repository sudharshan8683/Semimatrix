import { equipmentRepository } from '../repositories/equipment.repository.js';
import { sensorRepository } from '../repositories/sensor.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { injectedEventRepository } from '../repositories/injectedEvent.repository.js';
import { mlClientService, MLHealthRiskResponse } from './mlClient.service.js';

export interface EquipmentRiskCard {
  equipmentId: string;
  name: string;
  type: string;
  locationBay: string;
  healthIndex: number;
  failureProbability: number;
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  supervisedAvailable: boolean;
  supervisedModelNote: string;
  recommendedAction: string;
  contributingFactors: Array<{ factor: string; penalty_points: number; weight: string }>;
  recentAnomalies: Array<{ parameter: string; severity: string; z_score: number }>;
  engine: string;
}

export interface SyntheticDetectionScorecard {
  isSyntheticOnly: true;
  label: string;
  totalInjectedEvents: number;
  truePositivesDetected: number;
  falseAlarmsCount: number;
  precision: number; // 0 to 1
  recall: number; // 0 to 1
  falseAlarmsPerWeek: number;
  meanLeadTimeHours: number;
  scientificLimitationNotice: string;
}

export class PredictiveMaintenanceService {
  async getFleetMaintenanceOverview(
    workspaceId: string,
    filter: { sourceType?: 'synthetic' | 'uploaded' | 'benchmark' | 'live' } = {}
  ): Promise<{
    fleetRiskCards: EquipmentRiskCard[];
    detectionScorecard?: SyntheticDetectionScorecard;
    fleetHealthMean: number;
    highRiskCount: number;
    advisoryDisclaimer: string;
  }> {
    const sourceType = filter.sourceType ?? 'synthetic';
    const tools = await equipmentRepository.find(workspaceId, { sourceType });
    const allAlerts = await alertRepository.find(workspaceId, { state: 'open' });

    const cards: EquipmentRiskCard[] = [];
    let healthSum = 0;
    let highRiskCount = 0;

    for (const tool of tools) {
      const toolAlerts = allAlerts.filter((a) => a.equipmentId === tool.equipmentId);
      const readings = await sensorRepository.getTelemetryHistory(workspaceId, tool.equipmentId, 30);

      // Specs dictionary
      const specsMap: Record<string, { nominal: number; usl: number; lsl: number }> = {};
      for (const p of tool.parameters || []) {
        specsMap[p.name] = { nominal: p.nominal, usl: p.usl, lsl: p.lsl };
      }

      // Check anomalies
      const anomalyRes = await mlClientService.scoreAnomaly({
        equipment_id: tool.equipmentId,
        telemetry: readings.map((r) => r.metrics),
        nominal_specs: specsMap
      });

      // Calculate drift slope from last 15 points
      let driftSlope = 0;
      if (readings.length >= 10 && tool.parameters.length > 0) {
        const firstParam = tool.parameters[0].name;
        const pts = readings.map((r) => r.metrics[firstParam] ?? 0);
        const delta = pts[pts.length - 1] - pts[0];
        const nominal = tool.parameters[0].nominal || 1;
        driftSlope = Number((delta / nominal).toFixed(3));
      }

      // Days since last maintenance
      const lastPm = tool.lastMaintenanceAt ? new Date(tool.lastMaintenanceAt) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const daysSincePm = Math.max(1, (Date.now() - lastPm.getTime()) / (24 * 3600 * 1000));

      const spcViolations = toolAlerts.filter((a) => a.ruleViolated).length;

      // Score health & failure risk
      const riskScore = await mlClientService.scoreHealthRisk({
        equipment_id: tool.equipmentId,
        drift_slope: driftSlope,
        anomaly_rate: anomalyRes.is_anomaly ? 0.8 : 0.05,
        spc_violations_count: spcViolations,
        days_since_maintenance: daysSincePm,
        active_alarms_count: toolAlerts.length
      });

      let effectiveCategory = riskScore.risk_category;
      let effectiveHealth = riskScore.health_index;
      let effectiveProb = riskScore.failure_probability;

      if (tool.status === 'error' || toolAlerts.some((a) => a.severity === 'critical')) {
        effectiveCategory = 'critical';
        effectiveHealth = Math.min(38.0, effectiveHealth);
        effectiveProb = Math.max(0.75, effectiveProb);
      }

      let recommendation = 'Nominal operational status. Continue routine telemetry sampling.';
      if (effectiveCategory === 'critical') {
        recommendation = 'Critical degradation tripwire. Dispatch field engineer for chamber overhaul.';
        highRiskCount++;
      } else if (effectiveCategory === 'high') {
        recommendation = 'Accelerated degradation. Schedule preventative clean within next shift.';
        highRiskCount++;
      } else if (effectiveCategory === 'medium') {
        recommendation = 'Moderate drift observed. Inspect gas flow and sensor calibration at next PM.';
      }

      cards.push({
        equipmentId: tool.equipmentId,
        name: tool.name,
        type: tool.type,
        locationBay: tool.locationBay,
        healthIndex: effectiveHealth,
        failureProbability: effectiveProb,
        riskCategory: effectiveCategory,
        supervisedAvailable: riskScore.supervised_available,
        supervisedModelNote: riskScore.supervised_model_note,
        recommendedAction: recommendation,
        contributingFactors: riskScore.contributing_factors,
        recentAnomalies: anomalyRes.parameter_deviations.map((d) => ({
          parameter: d.parameter,
          severity: d.severity,
          z_score: d.z_score
        })),
        engine: riskScore.engine
      });

      healthSum += riskScore.health_index;
    }

    cards.sort((a, b) => b.failureProbability - a.failureProbability);

    // Scorecard on synthetic ground truth if synthetic data is active
    let scorecard: SyntheticDetectionScorecard | undefined;
    if (sourceType === 'synthetic') {
      const injectedEvents = await injectedEventRepository.find(workspaceId);
      const totalInjected = injectedEvents.length;

      // Evaluation against injected anomalies:
      // True positives = injected tools that correctly triggered critical/high alerts
      const highRiskIds = new Set(cards.filter((c) => c.riskCategory === 'critical' || c.riskCategory === 'high').map((c) => c.equipmentId));
      let tp = 0;
      let totalLeadHours = 0;

      for (const ev of injectedEvents) {
        if (ev.equipmentId && highRiskIds.has(ev.equipmentId)) {
          tp++;
          totalLeadHours += ev.expectedLeadTimeHours || 12;
        }
      }

      const totalAlerted = highRiskIds.size;
      const fp = Math.max(0, totalAlerted - tp);
      const precision = totalAlerted > 0 ? Number((tp / totalAlerted).toFixed(2)) : 0;
      const recall = totalInjected > 0 ? Number((tp / totalInjected).toFixed(2)) : 0;
      const avgLead = tp > 0 ? Number((totalLeadHours / tp).toFixed(1)) : 0;

      scorecard = {
        isSyntheticOnly: true,
        label: 'Evaluation against Injected Synthetic Ground Truth (Synthetic-Only)',
        totalInjectedEvents: totalInjected,
        truePositivesDetected: tp,
        falseAlarmsCount: fp,
        precision,
        recall,
        falseAlarmsPerWeek: fp,
        meanLeadTimeHours: avgLead,
        scientificLimitationNotice:
          'These performance scores are evaluated strictly against synthetic injected ground truth. They must not be cited as real cleanroom precision or accuracy.'
      };
    }

    return {
      fleetRiskCards: cards,
      detectionScorecard: scorecard,
      fleetHealthMean: tools.length > 0 ? Number((healthSum / tools.length).toFixed(1)) : 100,
      highRiskCount,
      advisoryDisclaimer:
        'Semimatrix is an advisory decision-support system. It never issues commands to or alters setpoints on semiconductor equipment. All actions require engineer review.'
    };
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceService();
