import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { datasetController } from '../controllers/dataset.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';

export const datasetRouter = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), env.DATASET_UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage: store under generated UUID, never the client's filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomUUID() + ext;
    cb(null, randomName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 // 25 MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsm') {
      return cb(AppError.badRequest('Macro-enabled workbooks (.xlsm) are rejected for security.'));
    }
    if (ext !== '.csv' && ext !== '.xlsx') {
      return cb(AppError.badRequest('Invalid file type. Only .csv and .xlsx files are accepted.'));
    }
    cb(null, true);
  }
});

datasetRouter.post(
  '/upload',
  requireAuth,
  requireRole(['owner', 'analyst']),
  upload.single('file'),
  datasetController.upload.bind(datasetController)
);

datasetRouter.get('/', requireAuth, datasetController.list.bind(datasetController));
datasetRouter.get('/:id', requireAuth, datasetController.getById.bind(datasetController));
datasetRouter.put(
  '/:id/mapping',
  requireAuth,
  requireRole(['owner', 'analyst']),
  datasetController.updateMapping.bind(datasetController)
);
datasetRouter.post(
  '/seed-synthetic',
  requireAuth,
  requireRole(['owner', 'analyst']),
  datasetController.seedSynthetic.bind(datasetController)
);
datasetRouter.post(
  '/generate-synthetic',
  requireAuth,
  requireRole(['owner', 'analyst']),
  datasetController.seedSynthetic.bind(datasetController)
);
datasetRouter.get(
  '/sample/download',
  requireAuth,
  datasetController.downloadSampleCsv.bind(datasetController)
);
datasetRouter.delete(
  '/:id',
  requireAuth,
  requireRole(['owner']),
  datasetController.delete.bind(datasetController)
);
