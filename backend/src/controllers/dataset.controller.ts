import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { datasetUploadService } from '../services/datasetUpload.service.js';
import { datasetRepository } from '../repositories/dataset.repository.js';
import { syntheticGeneratorService } from '../services/syntheticGenerator.service.js';
import { AppError } from '../errors/AppError.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';

export class DatasetController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const file = req.file;

      if (!file) {
        throw AppError.badRequest('No file uploaded. Please upload a .csv, .xlsx, or .zip file.');
      }

      const datasetName = (req.body.name as string) || file.originalname;
      const result = await datasetUploadService.processUpload(
        workspaceId,
        {
          path: file.path,
          originalname: file.originalname,
          size: file.size
        },
        datasetName,
        req.user?.userId
      );

      res.status(201).json({
        success: true,
        data: {
          dataset: result.dataset,
          profiling: result.profiling,
          capabilityMatrix: result.dataset.capabilityMatrix
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const datasets = await datasetRepository.find(workspaceId, {}, { sort: { createdAt: -1 } });
      res.status(200).json({
        success: true,
        data: { datasets }
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id;

      const dataset = await datasetRepository.findById(workspaceId, id);
      if (!dataset) {
        throw AppError.notFound(`Dataset ${id} not found in this workspace`);
      }

      res.status(200).json({
        success: true,
        data: { dataset }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMapping(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id;
      const { mapping } = req.body;

      if (!mapping || typeof mapping !== 'object') {
        throw AppError.badRequest('Invalid mapping format. Must provide a dictionary of column mappings.');
      }

      const dataset = await datasetRepository.findById(workspaceId, id);
      if (!dataset) {
        throw AppError.notFound(`Dataset ${id} not found in this workspace`);
      }

      // Re-evaluate capability matrix
      const updatedCapabilities = datasetUploadService.evaluateCapabilities(mapping);

      const updated = await datasetRepository.update(workspaceId, id, {
        columnMapping: mapping,
        capabilityMatrix: updatedCapabilities
      });

      res.status(200).json({
        success: true,
        data: {
          dataset: updated,
          capabilityMatrix: updatedCapabilities
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async seedSynthetic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { seed, days, toolCountPerType, scenario } = req.body;

      const result = await syntheticGeneratorService.generateAndPersist(workspaceId, {
        seed: seed ? Number(seed) : 42,
        days: days ? Number(days) : 7,
        toolCountPerType: toolCountPerType ? Number(toolCountPerType) : 3,
        scenario: scenario || 'all'
      });

      res.status(201).json({
        success: true,
        data: {
          message: 'Synthetic fab telemetry generated with seeded ground truth.',
          summary: {
            equipmentCount: result.equipmentCount,
            readingCount: result.readingCount,
            lotCount: result.lotCount,
            injectedEvents: result.injectedEventCount
          },
          scenario: result.scenario,
          targetFinding: result.targetFinding,
          datasetId: result.datasetId,
          downloadUrl: '/api/v1/datasets/sample/download'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async downloadSampleCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const filePath = path.resolve(process.cwd(), 'uploads', `sample_${workspaceId}.csv`);
      const fallbackPath = path.resolve(process.cwd(), 'uploads', 'semimatrix_seeded_demo.csv');

      const targetPath = fs.existsSync(filePath) ? filePath : fallbackPath;

      if (!fs.existsSync(targetPath)) {
        throw AppError.notFound('No synthetic sample CSV has been generated yet for this workspace.');
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="semimatrix_synthetic_sample.csv"');
      const fileStream = fs.createReadStream(targetPath);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const id = req.params.id;

      const dataset = await datasetRepository.findById(workspaceId, id);
      if (!dataset) {
        throw AppError.notFound(`Dataset ${id} not found in this workspace`);
      }

      await datasetRepository.delete(workspaceId, id);

      await auditLogRepository.record(workspaceId, 'delete', 'dataset', {
        userId: req.user?.userId,
        resourceId: id,
        details: { datasetName: dataset.name }
      });

      res.status(200).json({
        success: true,
        data: { message: `Dataset ${id} deleted successfully` }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const datasetController = new DatasetController();
