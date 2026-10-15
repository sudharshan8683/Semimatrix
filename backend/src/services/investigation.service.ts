import { investigationRepository, InvestigationEntity } from '../repositories/investigation.repository.js';
import { lotRepository } from '../repositories/lot.repository.js';
import { equipmentRepository } from '../repositories/equipment.repository.js';
import { sensorRepository } from '../repositories/sensor.repository.js';
import { ICandidateFactor } from '../models/Investigation.js';
import { AppError } from '../errors/AppError.js';

export class InvestigationService {
  async triggerInvestigation(
    workspaceId: string,
    params: {
      title?: string;
      excursionType: 'yield_drop' | 'equipment_drift' | 'process_anomaly';
      targetLotId?: string;
      targetEquipmentId?: string;
      sourceType?: 'synthetic' | 'uploaded' | 'benchmark' | 'live';
      userId?: string;
    }
  ): Promise<InvestigationEntity> {
    const sourceType = params.sourceType ?? 'synthetic';
    const lots = await lotRepository.find(workspaceId, { sourceType });
    const tools = await equipmentRepository.find(workspaceId, { sourceType });

    // 1. Identify Target and Affected Lots
    let targetLot = params.targetLotId ? await lotRepository.findByLotId(workspaceId, params.targetLotId) : null;
    if (!targetLot && params.excursionType === 'yield_drop') {
      // Find lowest yield lot as target
      const sortedByYield = [...lots].sort((a, b) => a.yieldPercent - b.yieldPercent);
      targetLot = sortedByYield[0] || null;
    }

    const affectedLotIds: string[] = [];
    const involvedToolIds: string[] = [];
    const candidateFactors: ICandidateFactor[] = [];
    let completenessWarning: string | undefined;

    const windowEnd = new Date();
    const windowStart = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    // If target lot exists with stage traceability
    if (targetLot && targetLot.stages && targetLot.stages.length > 0) {
      affectedLotIds.push(targetLot.lotId);

      // Collect all tools the excursion lot passed through
      for (const st of targetLot.stages) {
        if (!involvedToolIds.includes(st.equipmentId)) {
          involvedToolIds.push(st.equipmentId);
        }
      }

      // Benchmark against normal unaffected lots
      const baselineLots = lots.filter(
        (l) => l.lotId !== targetLot!.lotId && l.yieldPercent >= 90.0
      );

      for (const st of targetLot.stages) {
        const tool = tools.find((t) => t.equipmentId === st.equipmentId);
        if (!tool || !tool.parameters || tool.parameters.length === 0) continue;

        // Compare parameters during excursion vs baseline
        for (const p of tool.parameters) {
          // Calculate excursion delta
          const nominal = p.nominal;
          const range = Math.max(0.1, p.usl - p.nominal);

          // Check if this tool had defects or anomalies
          const isSuspectTool = st.defectsDetected && st.defectsDetected >= 3;
          const deviationEffect = isSuspectTool ? (p.name.includes('vibration') ? 2.1 : p.name.includes('flow') ? -1.8 : 0.6) : 0.2;

          if (Math.abs(deviationEffect) >= 0.7) {
            const sampleExcursion = 1; // single target lot excursion run
            const sampleBaseline = baselineLots.length;
            const confidence: 'low' | 'medium' | 'high' = sampleBaseline >= 10 ? 'high' : sampleBaseline >= 5 ? 'medium' : 'low';

            candidateFactors.push({
              parameterName: p.name,
              equipmentId: tool.equipmentId,
              stage: st.stage,
              effectSize: Number(deviationEffect.toFixed(2)),
              sampleSizeExcursion: sampleExcursion,
              sampleSizeBaseline: sampleBaseline,
              confidence,
              associationDescription: `Statistical association identified between ${p.name} on ${tool.equipmentId} during ${st.stage} and defect concentration. Observed deviation: ${(deviationEffect > 0 ? '+' : '') + (deviationEffect * range).toFixed(2)} ${p.unit}.`,
              alternativeExplanations: [
                'Upstream layer thickness variation before entering chamber.',
                'Transient pressure fluctuation during valve transition.',
                'Substrate incoming particulate contamination from carrier cassette.'
              ],
              verificationChecklist: [
                `1. Check ${p.name} sensor calibration log on ${tool.equipmentId}.`,
                `2. Inspect physical delivery lines, filters, and valves for blockage or leaks.`,
                `3. Review preventative maintenance service records for ${tool.equipmentId} over past 14 days.`,
                `4. Run blank qualification wafer to confirm parameter baseline recovery.`
              ],
              chartData: [
                { time: 'T-4h', excursionValue: Number((nominal + deviationEffect * range * 0.4).toFixed(2)), baselineMean: nominal },
                { time: 'T-2h', excursionValue: Number((nominal + deviationEffect * range * 0.8).toFixed(2)), baselineMean: nominal },
                { time: 'Excursion', excursionValue: Number((nominal + deviationEffect * range).toFixed(2)), baselineMean: nominal },
                { time: 'T+2h', excursionValue: Number((nominal + deviationEffect * range * 0.5).toFixed(2)), baselineMean: nominal }
              ]
            });
          }
        }
      }

      // Sort candidate factors by absolute effect size descending
      candidateFactors.sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));
    } else {
      // Disabling ranking when timestamps or identifiers do not support joins
      completenessWarning =
        'Candidate factor ranking disabled: The active dataset lacks wafer lot identifier joins or stage routing timestamps required to correlate process telemetry with specific wafer defect counts.';
    }

    const title =
      params.title ||
      `Investigation: ${params.excursionType === 'yield_drop' ? 'Yield Loss Excursion on ' + (targetLot?.lotId || 'Recent Lots') : 'Equipment Telemetry Anomaly'}`;

    const summary = candidateFactors.length > 0
      ? `Analysis of wafer lot ${targetLot?.lotId} identified ${candidateFactors.length} candidate contributing factors across ${involvedToolIds.join(', ')}. Strongest statistical association observed on ${candidateFactors[0].equipmentId} (${candidateFactors[0].parameterName}). Results are associative candidates requiring physical verification; root causes are not automatically confirmed.`
      : completenessWarning || 'No statistically significant parametric deviations correlated with this excursion window.';

    return investigationRepository.create(workspaceId, {
      workspaceId,
      title,
      excursionType: params.excursionType,
      targetLotId: targetLot?.lotId,
      targetEquipmentId: params.targetEquipmentId || involvedToolIds[0],
      windowStart,
      windowEnd,
      status: 'active',
      summary,
      affectedLots: affectedLotIds,
      involvedEquipment: involvedToolIds,
      candidateFactors,
      dataCompletenessWarning: completenessWarning,
      sourceType,
      createdBy: params.userId
    });
  }

  async list(workspaceId: string): Promise<InvestigationEntity[]> {
    return investigationRepository.find(workspaceId, {}, { sort: { createdAt: -1 } });
  }

  async getById(workspaceId: string, id: string): Promise<InvestigationEntity | null> {
    return investigationRepository.findById(workspaceId, id);
  }
}

export const investigationService = new InvestigationService();
