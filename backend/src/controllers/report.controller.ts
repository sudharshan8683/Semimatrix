import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service.js';
import { AppError } from '../errors/AppError.js';

export class ReportController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const reports = await reportService.list(workspaceId);
      res.status(200).json({
        success: true,
        data: { reports }
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;

      const report = await reportService.getById(workspaceId, id);
      if (!report) {
        throw AppError.notFound(`Report ${id} not found in this workspace`);
      }

      res.status(200).json({
        success: true,
        data: { report }
      });
    } catch (err) {
      next(err);
    }
  }

  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { title, analysisType, dataBasis, startDate, endDate, format } = req.body;

      if (!title || !analysisType || !dataBasis) {
        throw AppError.badRequest('title, analysisType, and dataBasis are required to generate a report.');
      }

      const report = await reportService.generateReport(workspaceId, {
        title,
        analysisType,
        dataBasis,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        userId: req.user?.userId,
        format: format || 'pdf'
      });

      res.status(201).json({
        success: true,
        data: { report }
      });
    } catch (err) {
      next(err);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id as string;

      const csvContent = await reportService.exportToCsv(workspaceId, id);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="semimatrix_report_${id}.csv"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
