import { describe, it, expect, beforeEach } from 'vitest';
import { investigationService } from '../../src/services/investigation.service.js';
import { reportService } from '../../src/services/report.service.js';
import { alertRepository } from '../../src/repositories/alert.repository.js';
import { auditLogRepository } from '../../src/repositories/auditLog.repository.js';
import { lotRepository } from '../../src/repositories/lot.repository.js';
import { equipmentRepository } from '../../src/repositories/equipment.repository.js';
import { InMemoryStore } from '../../src/repositories/base.repository.js';

describe('Stage 7: Root-Cause Investigation, Alerts Triage & Secure Reports', () => {
  beforeEach(() => {
    InMemoryStore.getInstance().clearAll();
  });

  describe('Root-Cause Investigation View (Criterion 9)', () => {
    it('ranks candidate contributing factors with effect size, sample size, cautious wording, and engineer checklist', async () => {
      const workspaceId = 'ws_inv_test';

      // 1. Seed equipment with parameters
      await equipmentRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'CMP-01',
        name: 'Ebara CMP Polisher',
        type: 'cmp',
        locationBay: 'Bay-03',
        status: 'error',
        parameters: [
          { name: 'slurry_flow', unit: 'mL/min', nominal: 180, usl: 200, lsl: 160, rangeMin: 140, rangeMax: 220 },
          { name: 'vibration', unit: 'mm/s RMS', nominal: 0.65, usl: 1.10, lsl: 0.20, rangeMin: 0.1, rangeMax: 1.8 }
        ],
        sourceType: 'synthetic'
      });

      // 2. Seed normal lots and 1 excursion lot
      for (let i = 1; i <= 10; i++) {
        await lotRepository.create(workspaceId, {
          workspaceId,
          lotId: `LOT-NORMAL-${i}`,
          recipeId: 'RECIPE-A',
          totalUnits: 25,
          goodUnits: 24,
          defectCount: 1,
          yieldPercent: 96.0,
          startTime: new Date(),
          currentStage: 'CMP',
          status: 'completed',
          stages: [{ stage: 'CMP', equipmentId: 'CMP-01', startTime: new Date(), endTime: new Date(), status: 'passed', defectsDetected: 0 }],
          sourceType: 'synthetic'
        });
      }

      await lotRepository.create(workspaceId, {
        workspaceId,
        lotId: 'LOT-EXCURSION-01',
        recipeId: 'RECIPE-A',
        totalUnits: 25,
        goodUnits: 16,
        defectCount: 9,
        yieldPercent: 64.0,
        startTime: new Date(),
        currentStage: 'CMP',
        status: 'scrapped',
        stages: [{ stage: 'CMP', equipmentId: 'CMP-01', startTime: new Date(), endTime: new Date(), status: 'failed', defectsDetected: 9 }],
        sourceType: 'synthetic'
      });

      // 3. Trigger investigation
      const inv = await investigationService.triggerInvestigation(workspaceId, {
        excursionType: 'yield_drop',
        targetLotId: 'LOT-EXCURSION-01',
        sourceType: 'synthetic'
      });

      expect(inv).toBeDefined();
      expect(inv.targetLotId).toBe('LOT-EXCURSION-01');
      expect(inv.candidateFactors.length).toBeGreaterThan(0);

      const topFactor = inv.candidateFactors[0];
      expect(topFactor.effectSize).not.toBe(0);
      expect(topFactor.sampleSizeBaseline).toBe(10);
      expect(topFactor.confidence).toBe('high');

      // CRITICAL VERIFICATION: Cautious wording required ("associated with" / "candidate contributor"), NEVER "root cause confirmed"
      expect(topFactor.associationDescription).toMatch(/statistical association identified/i);
      expect(inv.summary).not.toMatch(/root cause confirmed/i);
      expect(inv.summary).toMatch(/associative candidates requiring physical verification/i);

      // Engineer Verification Checklist present
      expect(topFactor.verificationChecklist.length).toBeGreaterThanOrEqual(3);
      expect(topFactor.verificationChecklist[0]).toMatch(/calibration log/i);

      // Alternative explanations present
      expect(topFactor.alternativeExplanations.length).toBeGreaterThanOrEqual(2);
    });

    it('disables candidate factor ranking when identifiers or timestamps do not support joins', async () => {
      const workspaceId = 'ws_inv_noj_test';

      // Seed lot without stage routing history (e.g. basic sensor upload without lot routing)
      await lotRepository.create(workspaceId, {
        workspaceId,
        lotId: 'LOT-UNJOINED',
        recipeId: 'RECIPE-X',
        totalUnits: 25,
        goodUnits: 18,
        defectCount: 7,
        yieldPercent: 72.0,
        startTime: new Date(),
        currentStage: 'UNKNOWN',
        status: 'completed',
        stages: [], // empty stages
        sourceType: 'uploaded'
      });

      const inv = await investigationService.triggerInvestigation(workspaceId, {
        excursionType: 'yield_drop',
        targetLotId: 'LOT-UNJOINED',
        sourceType: 'uploaded'
      });

      expect(inv.candidateFactors.length).toBe(0);
      expect(inv.dataCompletenessWarning).toBeDefined();
      expect(inv.dataCompletenessWarning).toMatch(/candidate factor ranking disabled/i);
    });
  });

  describe('Alerts Triage Lifecycle', () => {
    it('manages alert states (open -> acknowledged -> resolved) and logs audit events', async () => {
      const workspaceId = 'ws_alert_test';

      const alert = await alertRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'CVD-01',
        severity: 'critical',
        state: 'open',
        title: 'Chamber Pressure Limit Exceeded',
        description: 'Pressure reached 2660 mTorr',
        sourceType: 'synthetic'
      });
      expect(alert.state).toBe('open');

      // Acknowledge
      const acked = await alertRepository.update(workspaceId, alert._id, {
        state: 'acknowledged',
        acknowledgedBy: 'eng_alice',
        acknowledgedAt: new Date()
      });
      expect(acked?.state).toBe('acknowledged');
      expect(acked?.acknowledgedBy).toBe('eng_alice');

      // Record audit log
      await auditLogRepository.record(workspaceId, 'alert_ack', 'alert', {
        userId: 'eng_alice',
        resourceId: alert._id
      });

      // Verify audit log
      const logs = await auditLogRepository.find(workspaceId, { action: 'alert_ack' });
      expect(logs.length).toBe(1);
      expect(logs[0].resourceId).toBe(alert._id);
    });
  });

  describe('Reports Generation & Formula Neutralization (Criterion 10)', () => {
    it('generates reports with Data Basis, findings, actions, limitations, and defanged CSV export', async () => {
      const workspaceId = 'ws_rep_test';

      const report = await reportService.generateReport(workspaceId, {
        title: 'Q1 Cleanroom Operations Summary',
        analysisType: 'operations_summary',
        dataBasis: 'synthetic',
        userId: 'lead_engineer'
      });

      expect(report.title).toBe('Q1 Cleanroom Operations Summary');
      expect(report.dataBasis).toBe('synthetic');
      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.recommendedActions.length).toBeGreaterThan(0);
      expect(report.limitationsAndAssumptions.length).toBeGreaterThan(0);
      expect(report.limitationsAndAssumptions.some((l) => l.includes('SYNTHETIC'))).toBe(true);

      // Export to CSV and verify formula defanging
      const csv = await reportService.exportToCsv(workspaceId, report._id);
      expect(csv).toContain('SECTION,METRIC_NAME,METRIC_VALUE');
      expect(csv).toContain('# DATA_BASIS: SYNTHETIC');

      // Verify no cell starts with unescaped formula triggers
      const lines = csv.split('\n');
      for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const cells = line.split(',');
        for (const cell of cells) {
          // If a cell contains =, +, -, @, it must be safely quoted with an apostrophe
          if (/^[=+\-@]/.test(cell)) {
            expect(cell.startsWith("''") || cell.startsWith("\"'")).toBe(true);
          }
        }
      }
    });
  });
});
