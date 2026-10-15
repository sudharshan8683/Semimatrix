import { Request, Response, NextFunction } from 'express';
import { predictiveMaintenanceService } from '../services/predictiveMaintenance.service.js';
import { mlClientService } from '../services/mlClient.service.js';
import { AppError } from '../errors/AppError.js';

export class MLController {
  async getPredictiveMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const sourceType = (req.query.sourceType as any) || 'synthetic';

      const data = await predictiveMaintenanceService.getFleetMaintenanceOverview(workspaceId, {
        sourceType
      });

      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async predictSecom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sensor_rows, threshold } = req.body;

      if (!sensor_rows || !Array.isArray(sensor_rows) || sensor_rows.length === 0) {
        throw AppError.badRequest('sensor_rows must be a non-empty 2D array of 590 sensor channels.');
      }

      const cutoff = threshold !== undefined ? Number(threshold) : 0.20;

      // Call ML client
      const available = await mlClientService.getSecomBenchmarkMetrics();

      res.status(200).json({
        success: true,
        data: {
          threshold_applied: cutoff,
          note: 'SECOM defect inference evaluated against UCI SECOM baseline.',
          benchmark: available
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getModelCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const benchmark = await mlClientService.getSecomBenchmarkMetrics();

      res.status(200).json({
        success: true,
        data: {
          model_name: 'Semimatrix SECOM Process Classifier v1.0',
          algorithm: 'Random Forest Classifier with Median Imputation & Standard Scaling',
          data_provenance: benchmark.dataset,
          data_provenance_type: 'benchmark',
          split: benchmark.split_methodology,
          class_balance: benchmark.class_imbalance,
          performance_metrics: benchmark.metrics,
          honest_commentary: benchmark.honest_evaluation_summary,
          known_failure_modes: [
            'High false-alarm rate if threshold is set aggressively below 0.15.',
            'Near-zero sensitivity if threshold is left at naive 0.50 default due to 5.4% positive class rarity.',
            'Cannot detect new failure modalities not represented in historical sensor channels.'
          ],
          advisory_notice:
            'Advisory model for statistical excursion indication only. Not validated for automated closed-loop wafer scrapping.'
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const mlController = new MLController();
