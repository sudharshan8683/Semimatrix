import { equipmentRepository } from '../repositories/equipment.repository.js';
import { lotRepository } from '../repositories/lot.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { sensorRepository } from '../repositories/sensor.repository.js';
import {
  computeAvailability,
  computeUtilization,
  computeYield,
  computeDefectRate,
  computeThroughput,
  METRIC_DEFINITIONS
} from '../metrics/calculations.js';

export interface DashboardOverviewKPIs {
  totalEquipment: number;
  healthyTools: number;
  toolsNeedingAttention: number;
  highRiskEquipment: number;
  predictedFleetRisk: number; // 0 - 100%
  currentWaferYield: number; // %
  sevenDayYieldTrend: number; // % change (+/-)
  activeAlerts: number;
  estimatedDowntimeRiskHours: number;
  dataBasis: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
  timeWindow: string;
}

export interface OperationsOverviewData {
  kpis: DashboardOverviewKPIs;
  healthDistribution: {
    healthy: number;
    warning: number;
    critical: number;
    offline: number;
  };
  yieldTrend: Array<{
    date: string;
    yield: number;
    goodUnits: number;
    totalUnits: number;
    defectRate: number;
  }>;
  attentionQueue: Array<{
    equipmentId: string;
    name: string;
    type: string;
    status: string;
    riskScore: number;
    highestAlert?: string;
    actionRequired: string;
  }>;
  dataBasis: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
}

export class MetricsService {
  async getOperationsOverview(
    workspaceId: string,
    filter: { sourceType?: 'synthetic' | 'uploaded' | 'benchmark' | 'live'; days?: number } = {}
  ): Promise<OperationsOverviewData> {
    const days = filter.days ?? 7;
    const sourceType = filter.sourceType ?? 'synthetic';

    // 1. Fetch equipment
    const allTools = await equipmentRepository.find(workspaceId, { sourceType });
    const totalEquipment = allTools.length;

    // 2. Fetch lots
    const allLots = await lotRepository.find(workspaceId, { sourceType });

    // 3. Fetch active alerts
    const openAlerts = await alertRepository.find(workspaceId, { state: 'open', sourceType });

    // 4. Compute tool health categories based on status and alerts
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let offlineCount = 0;

    const attentionQueue: OperationsOverviewData['attentionQueue'] = [];

    for (const tool of allTools) {
      const toolAlerts = openAlerts.filter((a) => a.equipmentId === tool.equipmentId);
      const hasCritical = toolAlerts.some((a) => a.severity === 'critical');
      const hasWarning = toolAlerts.some((a) => a.severity === 'warning');

      let riskScore = 15; // baseline nominal risk
      let action = 'Continuous monitoring';

      if (tool.status === 'error' || hasCritical) {
        criticalCount++;
        riskScore = 85;
        action = 'Immediate engineer inspection required';
      } else if (tool.status === 'maintenance') {
        warningCount++;
        riskScore = 55;
        action = 'Scheduled maintenance in progress';
      } else if (hasWarning) {
        warningCount++;
        riskScore = 48;
        action = 'Investigate parameter drift';
      } else if (tool.status === 'offline') {
        offlineCount++;
        riskScore = 20;
        action = 'Tool powered down';
      } else {
        healthyCount++;
      }

      if (riskScore >= 45 || toolAlerts.length > 0) {
        attentionQueue.push({
          equipmentId: tool.equipmentId,
          name: tool.name,
          type: tool.type,
          status: tool.status,
          riskScore,
          highestAlert: toolAlerts[0]?.title,
          actionRequired: action
        });
      }
    }

    // Sort attention queue by risk descending
    attentionQueue.sort((a, b) => b.riskScore - a.riskScore);

    // 5. Compute Yield and 7-day trend from raw lots
    let totalGood = 0;
    let totalUnits = 0;
    const dateMap: Record<string, { good: number; total: number }> = {};

    for (const lot of allLots) {
      totalGood += lot.goodUnits;
      totalUnits += lot.totalUnits;

      const dateStr = new Date(lot.startTime).toISOString().slice(0, 10);
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { good: 0, total: 0 };
      }
      dateMap[dateStr].good += lot.goodUnits;
      dateMap[dateStr].total += lot.totalUnits;
    }

    const currentYield = computeYield(totalGood, totalUnits);

    const yieldTrend: OperationsOverviewData['yieldTrend'] = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        yield: computeYield(counts.good, counts.total),
        goodUnits: counts.good,
        totalUnits: counts.total,
        defectRate: computeDefectRate(counts.total - counts.good, counts.total)
      }));

    // Calculate trend difference (last day yield minus first day yield)
    let trendDelta = 0;
    if (yieldTrend.length >= 2) {
      trendDelta = Number((yieldTrend[yieldTrend.length - 1].yield - yieldTrend[0].yield).toFixed(2));
    }

    // Fleet average risk
    const fleetRisk = totalEquipment > 0
      ? Math.round(
          (healthyCount * 12 + warningCount * 50 + criticalCount * 85 + offlineCount * 20) / totalEquipment
        )
      : 0;

    const downtimeHours = criticalCount * 8.5 + warningCount * 3.0;

    const kpis: DashboardOverviewKPIs = {
      totalEquipment,
      healthyTools: healthyCount,
      toolsNeedingAttention: warningCount + criticalCount,
      highRiskEquipment: criticalCount,
      predictedFleetRisk: fleetRisk,
      currentWaferYield: currentYield,
      sevenDayYieldTrend: trendDelta,
      activeAlerts: openAlerts.length,
      estimatedDowntimeRiskHours: Number(downtimeHours.toFixed(1)),
      dataBasis: sourceType,
      timeWindow: `Past ${days} Days`
    };

    return {
      kpis,
      healthDistribution: {
        healthy: healthyCount,
        warning: warningCount,
        critical: criticalCount,
        offline: offlineCount
      },
      yieldTrend,
      attentionQueue,
      dataBasis: sourceType
    };
  }

  getMetricsMetadata() {
    return METRIC_DEFINITIONS;
  }
}

export const metricsService = new MetricsService();
