import { Request, Response, NextFunction } from 'express';
import { yieldService } from '../services/yield.service.js';
import { AppError } from '../errors/AppError.js';

export class LotController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { status, recipeId, sourceType } = req.query;

      const lots = await yieldService.getLots(workspaceId, {
        status: status as string,
        recipeId: recipeId as string,
        sourceType: sourceType as string
      });

      res.status(200).json({
        success: true,
        data: { lots }
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;

      const lot = await yieldService.getLotTraceability(workspaceId, id);
      if (!lot) {
        throw AppError.notFound(`Wafer lot ${id} not found in this workspace`);
      }

      res.status(200).json({
        success: true,
        data: { lot }
      });
    } catch (err) {
      next(err);
    }
  }

  async getYieldByStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { sourceType } = req.query;

      const stageBreakdown = await yieldService.getYieldByStage(workspaceId, {
        sourceType: sourceType as string
      });

      res.status(200).json({
        success: true,
        data: { stageBreakdown }
      });
    } catch (err) {
      next(err);
    }
  }

  async getYieldByTool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { sourceType } = req.query;

      const toolBreakdown = await yieldService.getYieldByTool(workspaceId, {
        sourceType: sourceType as string
      });

      res.status(200).json({
        success: true,
        data: { toolBreakdown }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const lotController = new LotController();
