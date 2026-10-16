import { Request, Response, NextFunction } from 'express';
import { investigationService } from '../services/investigation.service.js';
import { AppError } from '../errors/AppError.js';

export class InvestigationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const investigations = await investigationService.list(workspaceId);
      res.status(200).json({
        success: true,
        data: { investigations }
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;

      const investigation = await investigationService.getById(workspaceId, id);
      if (!investigation) {
        throw AppError.notFound(`Investigation ${id} not found in this workspace`);
      }

      res.status(200).json({
        success: true,
        data: { investigation }
      });
    } catch (err) {
      next(err);
    }
  }

  async trigger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { title, excursionType, targetLotId, targetEquipmentId, sourceType } = req.body;

      const investigation = await investigationService.triggerInvestigation(workspaceId, {
        title,
        excursionType: excursionType || 'yield_drop',
        targetLotId,
        targetEquipmentId,
        sourceType: sourceType || 'synthetic',
        userId: req.user?.userId
      });

      res.status(201).json({
        success: true,
        data: { investigation }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const investigationController = new InvestigationController();
