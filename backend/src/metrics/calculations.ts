export interface MetricDefinition {
  name: string;
  symbol: string;
  formula: string;
  denominator: string;
  timeWindowDefault: string;
  unit: string;
  description: string;
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  availability: {
    name: 'Operational Availability',
    symbol: 'A',
    formula: 'Availability = (Scheduled Time - Unscheduled Downtime) / Scheduled Time',
    denominator: 'Scheduled tool operating hours in the selected time window (typically 168 hours / 7 days)',
    timeWindowDefault: 'Last 7 Days (168 hours)',
    unit: '%',
    description: 'Fraction of planned production time during which the equipment is physically operable and not stopped by unscheduled failures or breakdown.'
  },
  utilization: {
    name: 'Tool Utilization',
    symbol: 'U',
    formula: 'Utilization = Productive Processing Time / Available Time',
    denominator: 'Available operable time (Scheduled Time - Unscheduled Downtime)',
    timeWindowDefault: 'Last 7 Days',
    unit: '%',
    description: 'Percentage of available uptime during which wafers are actively undergoing recipe processing.'
  },
  yield: {
    name: 'Wafer Yield',
    symbol: 'Y',
    formula: 'Yield = Good Wafers / Total Inspected Wafers',
    denominator: 'Total inspected wafers completing final stage metrology across all lots in the time window',
    timeWindowDefault: 'Last 7 Days',
    unit: '%',
    description: 'Proportion of manufactured wafers meeting all parametric and defect acceptance criteria.'
  },
  defectRate: {
    name: 'Defect Rate',
    symbol: 'DR',
    formula: 'Defect Rate = Defect Count / Total Inspected Wafers (or 100% - Yield)',
    denominator: 'Total inspected units in lot or bay',
    timeWindowDefault: 'Last 7 Days',
    unit: '%',
    description: 'Ratio of defective or scrapped wafers to total inspected wafers.'
  },
  throughput: {
    name: 'Fab Throughput',
    symbol: 'TH',
    formula: 'Throughput = Total Wafers Processed / Operational Hours / Tool Count',
    denominator: 'Total operational hours elapsed multiplied by active equipment count',
    timeWindowDefault: 'Last 24 Hours or 7 Days',
    unit: 'wafers/hour/tool',
    description: 'Average hourly wafer processing velocity per fabrication tool.'
  },
  cp: {
    name: 'Process Capability Index',
    symbol: 'Cp',
    formula: 'Cp = (USL - LSL) / (6 * sigma)',
    denominator: 'Six standard deviations of baseline process noise (6 * sigma)',
    timeWindowDefault: 'Phase I Baseline Window',
    unit: 'ratio',
    description: 'Potential process capability if centered between specification limits.'
  },
  cpk: {
    name: 'Minimum Process Capability Index',
    symbol: 'Cpk',
    formula: 'Cpk = min((USL - mean) / (3 * sigma), (mean - LSL) / (3 * sigma))',
    denominator: 'Three standard deviations (3 * sigma) to nearest specification limit',
    timeWindowDefault: 'Phase I Baseline Window',
    unit: 'ratio',
    description: 'Actual process capability taking into account process mean centering relative to USL/LSL.'
  }
};

/**
 * Availability = (scheduledTime - unscheduledDowntime) / scheduledTime
 * Clamped between 0 and 100%
 */
export function computeAvailability(scheduledHours: number, unscheduledDowntimeHours: number): number {
  if (scheduledHours <= 0) return 0;
  const avail = ((scheduledHours - Math.max(0, unscheduledDowntimeHours)) / scheduledHours) * 100;
  return Number(Math.max(0, Math.min(100, avail)).toFixed(2));
}

/**
 * Utilization = productiveProcessingHours / availableHours
 * Available Hours = scheduledHours - unscheduledDowntimeHours
 */
export function computeUtilization(processingHours: number, availableHours: number): number {
  if (availableHours <= 0) return 0;
  const util = (Math.max(0, processingHours) / availableHours) * 100;
  return Number(Math.max(0, Math.min(100, util)).toFixed(2));
}

/**
 * Yield = (goodUnits / totalUnits) * 100
 */
export function computeYield(goodUnits: number, totalUnits: number): number {
  if (totalUnits <= 0) return 0;
  const validGood = Math.max(0, Math.min(totalUnits, goodUnits));
  const y = (validGood / totalUnits) * 100;
  return Number(y.toFixed(2));
}

/**
 * Defect Rate = (defectCount / totalUnits) * 100 or 100 - Yield
 */
export function computeDefectRate(defectCount: number, totalUnits: number, goodUnits?: number): number {
  if (totalUnits <= 0) return 0;
  if (defectCount >= 0) {
    const dr = (Math.min(totalUnits, defectCount) / totalUnits) * 100;
    return Number(dr.toFixed(2));
  }
  if (goodUnits !== undefined) {
    return Number((100 - computeYield(goodUnits, totalUnits)).toFixed(2));
  }
  return 0;
}

/**
 * Throughput = totalUnitsProcessed / (operatingHours * toolCount)
 */
export function computeThroughput(totalUnitsProcessed: number, operatingHours: number, toolCount = 1): number {
  const denominator = operatingHours * Math.max(1, toolCount);
  if (denominator <= 0) return 0;
  const th = Math.max(0, totalUnitsProcessed) / denominator;
  return Number(th.toFixed(2));
}

/**
 * Cp = (USL - LSL) / (6 * sigma)
 */
export function computeCp(usl: number, lsl: number, sigma: number): number | null {
  if (sigma <= 0 || usl <= lsl) return null;
  return Number(((usl - lsl) / (6 * sigma)).toFixed(3));
}

/**
 * Cpk = min((USL - mean)/(3*sigma), (mean - LSL)/(3*sigma))
 */
export function computeCpk(mean: number, usl: number, lsl: number, sigma: number): number | null {
  if (sigma <= 0 || usl <= lsl) return null;
  const cpu = (usl - mean) / (3 * sigma);
  const cpl = (mean - lsl) / (3 * sigma);
  return Number(Math.min(cpu, cpl).toFixed(3));
}
