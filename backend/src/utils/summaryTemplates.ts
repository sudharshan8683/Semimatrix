/**
 * Plain-language explanation templates for findings, alerts, excursions, and maintenance risks.
 * Rules:
 * - Deterministic output derived strictly from computed facts (no LLMs).
 * - Honest, non-conclusive technical wording ("associated with", "candidate contributor", never "root cause confirmed").
 * - Accessible to evaluators without fab domain experience.
 */

export interface AlertSummaryFacts {
  equipmentId: string;
  parameterName?: string;
  actualValue?: number;
  thresholdValue?: number;
  ruleViolated?: string;
  unit?: string;
}

export interface DriftSummaryFacts {
  equipmentId: string;
  parameterName: string;
  driftRatePerHour: number;
  durationHours: number;
  currentValue: number;
  unit?: string;
}

export interface YieldExcursionFacts {
  lotId: string;
  equipmentId: string;
  yieldPercent: number;
  scrapCount: number;
  totalWafers: number;
  stageName?: string;
}

export interface InvestigationCandidateFacts {
  factorName: string;
  equipmentId: string;
  parameterName: string;
  effectSize: number; // Cohen's d
  sampleSize: number;
}

export interface MaintenanceRiskFacts {
  equipmentId: string;
  riskScore: number;
  primaryFactor: string;
}

export const summaryTemplates = {
  alert(facts: AlertSummaryFacts): string {
    const unitStr = facts.unit ? ` ${facts.unit}` : '';
    const valStr = facts.actualValue !== undefined ? ` (reading: ${facts.actualValue.toFixed(2)}${unitStr})` : '';
    const limitStr = facts.thresholdValue !== undefined ? ` beyond threshold ${facts.thresholdValue.toFixed(2)}${unitStr}` : '';
    const ruleStr = facts.ruleViolated ? ` [${facts.ruleViolated}]` : '';

    return `Tool ${facts.equipmentId} ${facts.parameterName || 'parameter'} is operating outside nominal boundaries${valStr}${limitStr}${ruleStr}. Routine production should be paused for sensor verification.`;
  },

  drift(facts: DriftSummaryFacts): string {
    const unitStr = facts.unit ? ` ${facts.unit}` : '';
    const direction = facts.driftRatePerHour >= 0 ? 'upward' : 'downward';
    const rateFormatted = Math.abs(facts.driftRatePerHour).toFixed(2);

    return `Tool ${facts.equipmentId} ${facts.parameterName} has been drifting ${direction} at ~${rateFormatted}${unitStr}/hr over the past ${facts.durationHours} hours. This gradual degradation is associated with chamber wear and requires thermocouple or valve inspection.`;
  },

  yieldExcursion(facts: YieldExcursionFacts): string {
    const lossPct = (100 - facts.yieldPercent).toFixed(1);
    const stageStr = facts.stageName ? ` during ${facts.stageName}` : '';

    return `Wafer lot ${facts.lotId} suffered an abnormal ${lossPct}% yield loss (${facts.scrapCount} of ${facts.totalWafers} wafers scrapped)${stageStr}, associated with processing on tool ${facts.equipmentId}. Upstream process stages showed normal yield.`;
  },

  investigationCandidate(facts: InvestigationCandidateFacts): string {
    const strength = Math.abs(facts.effectSize) >= 1.5 ? 'strongly associated' : 'moderately associated';
    return `${facts.factorName} on equipment ${facts.equipmentId} is ${strength} with the observed yield excursion (standardized effect size d = ${facts.effectSize.toFixed(2)}, based on ${facts.sampleSize} samples). This is a candidate contributor and requires physical verification.`;
  },

  maintenanceRisk(facts: MaintenanceRiskFacts): string {
    const urgency = facts.riskScore >= 70 ? 'urgent' : facts.riskScore >= 40 ? 'elevated' : 'nominal';
    return `Equipment ${facts.equipmentId} exhibits ${urgency} degradation risk (${facts.riskScore}%), primarily driven by ${facts.primaryFactor}. Preventive chamber servicing is recommended before next lot track-in.`;
  }
};
