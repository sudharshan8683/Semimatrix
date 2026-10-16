import { Request, Response, NextFunction } from 'express';
import { equipmentRepository } from '../repositories/equipment.repository.js';
import { sensorRepository } from '../repositories/sensor.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { spcService, SPCPoint } from '../services/spc.service.js';
import { AppError } from '../errors/AppError.js';

export class EquipmentController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { type, status, bay, sourceType } = req.query;

      const filter: Record<string, any> = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (bay) filter.locationBay = bay;
      if (sourceType) filter.sourceType = sourceType;

      const tools = await equipmentRepository.find(workspaceId, filter, { sort: { equipmentId: 1 } });
      const openAlerts = await alertRepository.find(workspaceId, { state: 'open' });

      // Attach real-time health indicator and active alert count
      const result = tools.map((tool) => {
        const toolAlerts = openAlerts.filter((a) => a.equipmentId === tool.equipmentId);
        const hasCritical = toolAlerts.some((a) => a.severity === 'critical');
        const hasWarning = toolAlerts.some((a) => a.severity === 'warning');

        let healthScore = 95;
        if (tool.status === 'error' || hasCritical) healthScore = 42;
        else if (tool.status === 'maintenance') healthScore = 65;
        else if (hasWarning) healthScore = 74;
        else if (tool.status === 'offline') healthScore = 50;

        return {
          ...tool,
          activeAlertCount: toolAlerts.length,
          healthScore
        };
      });

      res.status(200).json({
        success: true,
        data: { equipment: result }
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;

      // Allow lookup by Mongo _id OR tool equipmentId (e.g. CVD-01)
      let tool = await equipmentRepository.findById(workspaceId, id);
      if (!tool) {
        tool = await equipmentRepository.findByEquipmentId(workspaceId, id);
      }

      if (!tool) {
        throw AppError.notFound(`Equipment ${id} not found in this workspace`);
      }

      const alerts = await alertRepository.find(workspaceId, { equipmentId: tool.equipmentId }, { limit: 10 });
      const recentReadings = await sensorRepository.getTelemetryHistory(workspaceId, tool.equipmentId, 20);

      res.status(200).json({
        success: true,
        data: {
          equipment: tool,
          recentReadings,
          alerts
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const startTime = req.query.startTime ? new Date(req.query.startTime as string) : undefined;
      const endTime = req.query.endTime ? new Date(req.query.endTime as string) : undefined;

      let tool = await equipmentRepository.findById(workspaceId, id);
      if (!tool) {
        tool = await equipmentRepository.findByEquipmentId(workspaceId, id);
      }
      if (!tool) {
        throw AppError.notFound(`Equipment ${id} not found`);
      }

      const readings = await sensorRepository.getTelemetryHistory(
        workspaceId,
        tool.equipmentId,
        limit,
        startTime,
        endTime
      );

      res.status(200).json({
        success: true,
        data: {
          equipmentId: tool.equipmentId,
          readings
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getSpcAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;
      const paramName = req.query.parameter as string;
      const baselineCount = req.query.baselineCount ? Number(req.query.baselineCount) : undefined;

      if (!paramName) {
        throw AppError.badRequest('Query parameter "parameter" is required for SPC analysis.');
      }

      let tool = await equipmentRepository.findById(workspaceId, id);
      if (!tool) {
        tool = await equipmentRepository.findByEquipmentId(workspaceId, id);
      }
      if (!tool) {
        throw AppError.notFound(`Equipment ${id} not found`);
      }

      // Find parameter specification from catalogue
      const paramSpec = tool.parameters?.find((p) => p.name === paramName);
      const unit = paramSpec?.unit || '';

      // Fetch sensor telemetry history
      const readings = await sensorRepository.getTelemetryHistory(workspaceId, tool.equipmentId, 150);

      const points: SPCPoint[] = [];
      for (const r of readings) {
        if (r.metrics && r.metrics[paramName] !== undefined) {
          points.push({
            timestamp: new Date(r.timestamp).toISOString(),
            value: r.metrics[paramName],
            lotId: r.lotId
          });
        }
      }

      if (points.length === 0) {
        throw AppError.badRequest(`No telemetry points found for parameter "${paramName}" on equipment ${tool.equipmentId}.`);
      }

      const spcResult = spcService.analyzeSeries(points, paramName, unit, {
        baselineCount,
        usl: paramSpec?.usl,
        lsl: paramSpec?.lsl
      });

      res.status(200).json({
        success: true,
        data: {
          equipmentId: tool.equipmentId,
          equipmentName: tool.name,
          equipmentType: tool.type,
          spc: spcResult
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const equipmentController = new EquipmentController();
