import { Request, Response, NextFunction } from 'express';
import { alertRepository } from '../repositories/alert.repository.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';
import { AppError } from '../errors/AppError.js';

export class AlertController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { state, severity, equipmentId } = req.query;

      const filter: Record<string, any> = {};
      if (state) filter.state = state;
      if (severity) filter.severity = severity;
      if (equipmentId) filter.equipmentId = equipmentId;

      const alerts = await alertRepository.find(workspaceId, filter, { sort: { createdAt: -1 } });

      res.status(200).json({
        success: true,
        data: { alerts }
      });
    } catch (err) {
      next(err);
    }
  }

  async acknowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;

      const alert = await alertRepository.findById(workspaceId, id);
      if (!alert) {
        throw AppError.notFound(`Alert ${id} not found in this workspace`);
      }

      const updated = await alertRepository.update(workspaceId, id, {
        state: 'acknowledged',
        acknowledgedBy: req.user?.userId,
        acknowledgedAt: new Date()
      });

      await auditLogRepository.record(workspaceId, 'alert_ack', 'alert', {
        userId: req.user?.userId,
        userEmail: req.user?.email,
        resourceId: id,
        details: { title: alert.title, equipmentId: alert.equipmentId }
      });

      res.status(200).json({
        success: true,
        data: { alert: updated }
      });
    } catch (err) {
      next(err);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;
      const { notes } = req.body;

      const alert = await alertRepository.findById(workspaceId, id);
      if (!alert) {
        throw AppError.notFound(`Alert ${id} not found in this workspace`);
      }

      const updated = await alertRepository.update(workspaceId, id, {
        state: 'resolved',
        resolvedBy: req.user?.userId,
        resolvedAt: new Date(),
        resolutionNotes: notes || 'Resolved by engineer'
      });

      await auditLogRepository.record(workspaceId, 'alert_resolve', 'alert', {
        userId: req.user?.userId,
        userEmail: req.user?.email,
        resourceId: id,
        details: { title: alert.title, resolutionNotes: notes }
      });

      res.status(200).json({
        success: true,
        data: { alert: updated }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const alertController = new AlertController();
