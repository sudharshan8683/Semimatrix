import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metrics.service.js';

export class DashboardController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const sourceType = (req.query.sourceType as any) || 'synthetic';
      const days = req.query.days ? Number(req.query.days) : 7;

      const data = await metricsService.getOperationsOverview(workspaceId, {
        sourceType,
        days
      });

      res.status(200).json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async getMetadata(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        definitions: metricsService.getMetricsMetadata()
      }
    });
  }
}

export const dashboardController = new DashboardController();
