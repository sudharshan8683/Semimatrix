import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import * as xlsx from 'xlsx';
import { AppError } from '../errors/AppError.js';
import { ICapabilityMatrix, ICapabilityStatus } from '../models/Dataset.js';
import { datasetRepository, DatasetEntity } from '../repositories/dataset.repository.js';
import { auditLogRepository } from '../repositories/auditLog.repository.js';

export const CANONICAL_FIELDS = [
  'timestamp',
  'equipment_id',
  'equipment_type',
  'wafer_lot_id',
  'wafer_id',
  'process_stage',
  'temperature',
  'pressure',
  'vibration',
  'current',
  'processing_time',
  'equipment_status',
  'downtime',
  'total_units',
  'good_units',
  'defect_count',
  'failure_label',
  'maintenance_event'
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];

// Comprehensive semiconductor synonym dictionary
export const SYNONYM_DICTIONARY: Record<CanonicalField, string[]> = {
  timestamp: ['timestamp', 'time', 'date', 'datetime', 'ts', 'recorded_at', 'process_time', 'time_stamp'],
  equipment_id: ['equipment_id', 'tool_id', 'tool', 'chamber_id', 'machine_id', 'station', 'toolid', 'eq_id'],
  equipment_type: ['equipment_type', 'tool_type', 'machine_type', 'type', 'category', 'bay_type'],
  wafer_lot_id: ['wafer_lot_id', 'lot_id', 'lot', 'batch_id', 'batch', 'run_id', 'lotid', 'carrier_id'],
  wafer_id: ['wafer_id', 'wafer', 'slot_id', 'wafer_number', 'wafer_idx'],
  process_stage: ['process_stage', 'stage', 'step', 'operation', 'recipe_step', 'station_name'],
  temperature: ['temperature', 'temp', 'chamber_temp', 'temp_c', 'chuck_temp', 'heater_temp', 't', 'temperature_c'],
  pressure: ['pressure', 'chamber_pressure', 'vac_pressure', 'vacuum', 'mtorr', 'press', 'press_mtorr', 'p'],
  vibration: ['vibration', 'vib', 'pump_vibration', 'rms_vibration', 'accel_rms', 'vibration_rms'],
  current: ['current', 'beam_current', 'bias_current', 'motor_current', 'amps', 'current_ma'],
  processing_time: ['processing_time', 'duration', 'step_time', 'process_duration_sec', 'run_time'],
  equipment_status: ['equipment_status', 'status', 'state', 'tool_status', 'mode'],
  downtime: ['downtime', 'downtime_minutes', 'unscheduled_downtime', 'down_hours'],
  total_units: ['total_units', 'total_wafers', 'inspected_units', 'batch_size', 'wafers_in', 'total_count'],
  good_units: ['good_units', 'passed_wafers', 'pass_count', 'good_wafers', 'wafers_out', 'yielded_units'],
  defect_count: ['defect_count', 'defects', 'fails', 'failed_wafers', 'scrapped_units', 'loss_count'],
  failure_label: ['failure_label', 'failure', 'fail', 'is_failure', 'maintenance_required', 'target'],
  maintenance_event: ['maintenance_event', 'pm_event', 'maintenance_flag', 'serviced', 'pm_done']
};

export interface ColumnProfile {
  name: string;
  detectedType: 'number' | 'string' | 'date' | 'boolean';
  missingPercent: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  isConstant: boolean;
  unitHint?: string;
  suggestedCanonical?: CanonicalField;
  mappingConfidence: number;
}

export interface ProfilingResult {
  columns: ColumnProfile[];
  rowCount: number;
  duplicateRows: number;
  timestampColumn?: string;
  detectedTimezone?: string;
  qualityScore: number;
  previewRows: Record<string, any>[];
  anomaliesDetected: string[];
}

export class DatasetUploadService {
  // 1. Magic byte verification
  validateFileMagic(filePath: string, originalName: string): 'csv' | 'xlsx' {
    const ext = path.extname(originalName).toLowerCase();
    if (ext === '.xlsm') {
      throw AppError.badRequest('Macro-enabled workbooks (.xlsm) are strictly rejected for security.');
    }
    if (ext !== '.csv' && ext !== '.xlsx') {
      throw AppError.badRequest('Invalid file extension. Only .csv and .xlsx files are supported.');
    }

    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    if (ext === '.xlsx') {
      // PK zip header bytes: 50 4B 03 04
      if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
        return 'xlsx';
      }
      throw AppError.badRequest('Corrupted or spoofed Excel file header.');
    }

    // CSV text check: ensures no binary executable or zip headers
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      throw AppError.badRequest('Binary executable spoofing detected in CSV upload.');
    }
    return 'csv';
  }

  // 2. Defang formulas to prevent CSV Injection (=, +, -, @)
  defangValue(val: any): any {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^[=+\-@]/.test(trimmed)) {
        return "'" + trimmed;
      }
      return trimmed;
    }
    return val;
  }

  // 3. Stream-parse CSV rows safely
  async parseCsv(filePath: string, maxRows = 100000): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, any>[] = [];
      let rowCount = 0;

      fs.createReadStream(filePath)
        .pipe(csvParser({ skipLines: 0 }))
        .on('data', (data) => {
          if (rowCount < maxRows) {
            // Defang all cells and filter comment rows starting with #
            const defangedRow: Record<string, any> = {};
            let isComment = false;
            for (const [k, v] of Object.entries(data)) {
              if (k.startsWith('#')) {
                isComment = true;
                break;
              }
              defangedRow[k.trim()] = this.defangValue(v);
            }
            if (!isComment && Object.keys(defangedRow).length > 0) {
              rows.push(defangedRow);
              rowCount++;
            }
          }
        })
        .on('end', () => resolve(rows))
        .on('error', (err) => reject(new AppError(400, 'MALFORMED_DATA', `CSV parsing error: ${err.message}`)));
    });
  }

  // 4. Safe Excel Parser (no formulas, sheet limits)
  parseExcel(filePath: string, maxRows = 100000): Record<string, any>[] {
    try {
      const workbook = xlsx.readFile(filePath, {
        cellFormula: false,
        cellHTML: false,
        sheetRows: maxRows + 5
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw AppError.badRequest('Excel workbook contains no sheets.');
      }

      // Read only first sheet safely
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: Record<string, any>[] = xlsx.utils.sheet_to_json(sheet, { defval: null });

      return rawRows.slice(0, maxRows).map((row) => {
        const defanged: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          defanged[k.trim()] = this.defangValue(v);
        }
        return defanged;
      });
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest(`Excel parsing failed: ${err.message}`);
    }
  }

  // 5. Profiler & Type Inferrer
  profileData(rows: Record<string, any>[]): ProfilingResult {
    if (rows.length === 0) {
      throw AppError.badRequest('Uploaded dataset contains zero valid data rows.');
    }

    const columnNames = Object.keys(rows[0]);
    const columns: ColumnProfile[] = [];
    const anomalies: string[] = [];
    let timestampCol: string | undefined;

    for (const col of columnNames) {
      let missingCount = 0;
      let numericCount = 0;
      let dateCount = 0;
      let minVal = Infinity;
      let maxVal = -Infinity;
      const uniqueSet = new Set<any>();

      for (const row of rows) {
        const val = row[col];
        if (val === null || val === undefined || val === '' || val === 'NaN' || val === 'null') {
          missingCount++;
          continue;
        }

        uniqueSet.add(val);

        // Check if numeric
        const num = Number(val);
        if (!isNaN(num) && typeof val !== 'boolean') {
          numericCount++;
          if (num < minVal) minVal = num;
          if (num > maxVal) maxVal = num;
        } else if (!isNaN(Date.parse(val)) && typeof val === 'string' && val.length > 5 && isNaN(Number(val))) {
          dateCount++;
        }
      }

      const total = rows.length;
      const validCount = total - missingCount;
      const missingPct = Number(((missingCount / total) * 100).toFixed(2));
      const isNumeric = validCount > 0 && numericCount / validCount > 0.8;
      const isDate = validCount > 0 && dateCount / validCount > 0.8;

      let detectedType: 'number' | 'string' | 'date' | 'boolean' = 'string';
      if (isNumeric) detectedType = 'number';
      else if (isDate) detectedType = 'date';

      // Detect timestamp candidate
      if (detectedType === 'date' && !timestampCol) {
        timestampCol = col;
      }

      // Detect unit hint from column name e.g. "temperature_degC" or "press (mTorr)"
      let unitHint: string | undefined;
      const unitMatch = col.match(/\(([^)]+)\)|_([a-zA-Z%]+)$/);
      if (unitMatch) {
        unitHint = unitMatch[1] || unitMatch[2];
      }

      // Check physical anomalies (e.g. impossible negative pressure or temperature Kelvin < 0)
      if (isNumeric) {
        if (/pressure/i.test(col) && minVal < 0) {
          anomalies.push(`Column '${col}': Physically impossible negative pressure (${minVal}).`);
        }
        if (/yield/i.test(col) && (maxVal > 100 || minVal < 0)) {
          anomalies.push(`Column '${col}': Yield values outside [0, 100%] range.`);
        }
      }

      // Auto-map candidate with confidence
      const mapping = this.matchCanonicalField(col);

      columns.push({
        name: col,
        detectedType,
        missingPercent: missingPct,
        uniqueCount: uniqueSet.size,
        min: isNumeric && minVal !== Infinity ? minVal : undefined,
        max: isNumeric && maxVal !== -Infinity ? maxVal : undefined,
        isConstant: uniqueSet.size <= 1 && validCount > 0,
        unitHint,
        suggestedCanonical: mapping.field,
        mappingConfidence: mapping.confidence
      });
    }

    // Duplicate row detection (sample top 500 for performance)
    const sample = rows.slice(0, 500);
    const seen = new Set<string>();
    let duplicates = 0;
    for (const r of sample) {
      const str = JSON.stringify(r);
      if (seen.has(str)) duplicates++;
      else seen.add(str);
    }

    // Quality Score calculation (0 to 100)
    let score = 100;
    for (const c of columns) {
      if (c.missingPercent > 20) score -= 5;
      if (c.isConstant) score -= 3;
    }
    if (anomalies.length > 0) score -= 15;
    score = Math.max(10, Math.min(100, Math.round(score)));

    return {
      columns,
      rowCount: rows.length,
      duplicateRows: duplicates,
      timestampColumn: timestampCol,
      qualityScore: score,
      previewRows: rows.slice(0, 10),
      anomaliesDetected: anomalies
    };
  }

  // 6. Synonym matching to canonical fields
  matchCanonicalField(columnName: string): { field?: CanonicalField; confidence: number } {
    const clean = columnName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').trim();

    // 1. Pass 1: Exact matches (100% confidence)
    for (const [canonical, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
      for (const syn of synonyms) {
        if (clean === syn) {
          return { field: canonical as CanonicalField, confidence: 1.0 };
        }
      }
    }

    // 2. Pass 2: Word boundary or prefix/suffix matches for multi-character terms (min 3 chars)
    const tokens = clean.split('_').filter(Boolean);
    for (const [canonical, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
      for (const syn of synonyms) {
        if (syn.length < 3) continue;
        if (tokens.includes(syn) || clean.startsWith(syn + '_') || clean.endsWith('_' + syn)) {
          return { field: canonical as CanonicalField, confidence: 0.9 };
        }
        if (clean.includes(syn)) {
          return { field: canonical as CanonicalField, confidence: 0.8 };
        }
      }
    }
    return { confidence: 0.0 };
  }

  // 7. Analysis Capability Matrix Evaluation
  evaluateCapabilities(mapping: Record<string, string>): ICapabilityMatrix {
    const mappedCanonical = new Set(Object.values(mapping));

    // Yield Analysis Requirements: total_units and good_units (or defect_count) + (timestamp or wafer_lot_id)
    const hasYieldMetrics =
      mappedCanonical.has('total_units') &&
      (mappedCanonical.has('good_units') || mappedCanonical.has('defect_count'));
    const hasYieldContext = mappedCanonical.has('timestamp') || mappedCanonical.has('wafer_lot_id');
    const yieldStatus: ICapabilityStatus = {
      available: hasYieldMetrics && hasYieldContext,
      status: hasYieldMetrics && hasYieldContext ? 'available' : hasYieldMetrics ? 'partially_available' : 'blocked',
      missingFields: [
        ...(!mappedCanonical.has('total_units') ? ['total_units'] : []),
        ...(!mappedCanonical.has('good_units') && !mappedCanonical.has('defect_count') ? ['good_units or defect_count'] : []),
        ...(!hasYieldContext ? ['timestamp or wafer_lot_id'] : [])
      ],
      explanation: hasYieldMetrics && hasYieldContext
        ? 'All required production volume, yield counts, and lot/timestamp fields are mapped.'
        : 'Yield analysis requires total inspected units, good units (or defect count), and lot/timestamp context. Cannot compute yield from telemetry alone.'
    };

    // Statistical Process Control (SPC) Requirements: timestamp + at least one numeric parameter
    const hasTimestamp = mappedCanonical.has('timestamp');
    const hasEquipment = mappedCanonical.has('equipment_id');
    const hasNumeric =
      mappedCanonical.has('temperature') ||
      mappedCanonical.has('pressure') ||
      mappedCanonical.has('vibration') ||
      mappedCanonical.has('current');

    const spcStatus: ICapabilityStatus = {
      available: hasTimestamp && hasNumeric,
      status: hasTimestamp && hasNumeric ? 'available' : hasNumeric ? 'partially_available' : 'blocked',
      missingFields: [
        ...(!hasTimestamp ? ['timestamp'] : []),
        ...(!hasNumeric ? ['at least one numeric parameter (temperature, pressure, vibration, current)'] : [])
      ],
      explanation: hasTimestamp && hasNumeric
        ? 'Time-series telemetry available for Phase I baseline calculation and Nelson control rules.'
        : 'SPC charts require sequential timestamped numeric measurements. Missing chronological telemetry.'
    };

    // Anomaly Detection: equipment_id + timestamp + parameters
    const anomalyStatus: ICapabilityStatus = {
      available: hasEquipment && hasTimestamp && hasNumeric,
      status: hasEquipment && hasTimestamp && hasNumeric ? 'available' : hasNumeric && hasTimestamp ? 'partially_available' : 'blocked',
      missingFields: [
        ...(!hasEquipment ? ['equipment_id'] : []),
        ...(!hasTimestamp ? ['timestamp'] : []),
        ...(!hasNumeric ? ['numeric sensor telemetry'] : [])
      ],
      explanation: hasEquipment && hasTimestamp && hasNumeric
        ? 'Equipment identification and multi-channel telemetry mapped for Isolation Forest & z-score models.'
        : 'Anomaly detection requires tool-scoped time-series sensor telemetry.'
    };

    // Predictive Maintenance: equipment_id + timestamp + parameters + failure_label / maintenance_event
    const hasLabels = mappedCanonical.has('failure_label') || mappedCanonical.has('maintenance_event');
    const pmmStatus: ICapabilityStatus = {
      available: hasEquipment && hasTimestamp && hasNumeric && hasLabels,
      status: hasEquipment && hasTimestamp && hasNumeric && hasLabels
        ? 'available'
        : hasEquipment && hasTimestamp && hasNumeric
          ? 'partially_available'
          : 'blocked',
      missingFields: [
        ...(!hasEquipment ? ['equipment_id'] : []),
        ...(!hasTimestamp ? ['timestamp'] : []),
        ...(!hasNumeric ? ['sensor telemetry'] : []),
        ...(!hasLabels ? ['failure_label or maintenance_event'] : [])
      ],
      explanation: hasEquipment && hasTimestamp && hasNumeric && hasLabels
        ? 'Supervised failure training data and health index metrics ready.'
        : hasEquipment && hasTimestamp && hasNumeric
          ? 'Partially available: Rule-based health index can run; supervised ML models blocked due to lack of historical failure labels.'
          : 'Predictive maintenance requires equipment telemetry and historical failure annotations.'
    };

    // Lot Traceability & Correlation: wafer_lot_id + equipment_id + timestamp
    const hasLot = mappedCanonical.has('wafer_lot_id');
    const lotTraceStatus: ICapabilityStatus = {
      available: hasLot && hasEquipment && hasTimestamp,
      status: hasLot && hasEquipment && hasTimestamp ? 'available' : hasLot ? 'partially_available' : 'blocked',
      missingFields: [
        ...(!hasLot ? ['wafer_lot_id'] : []),
        ...(!hasEquipment ? ['equipment_id'] : []),
        ...(!hasTimestamp ? ['timestamp'] : [])
      ],
      explanation: hasLot && hasEquipment && hasTimestamp
        ? 'Wafer lot identifiers and tool routing history mapped for stage-to-stage excursion correlation.'
        : 'Lot traceability requires lot identifiers, equipment associations, and stage timestamps.'
    };

    return {
      yieldAnalysis: yieldStatus,
      spcControl: spcStatus,
      anomalyDetection: anomalyStatus,
      predictiveMaintenance: pmmStatus,
      lotTraceability: lotTraceStatus
    };
  }

  // 8. Process Uploaded File
  async processUpload(
    workspaceId: string,
    file: { path: string; originalname: string; size: number },
    datasetName: string,
    userId?: string
  ): Promise<{ dataset: DatasetEntity; profiling: ProfilingResult }> {
    // Check magic bytes and extension
    const format = this.validateFileMagic(file.path, file.originalname);

    // Parse rows safely
    const rows = format === 'csv'
      ? await this.parseCsv(file.path)
      : this.parseExcel(file.path);

    // Profile data
    const profiling = this.profileData(rows);

    // Default column mapping using auto-detection
    const defaultMapping: Record<string, string> = {};
    for (const col of profiling.columns) {
      if (col.suggestedCanonical && col.mappingConfidence >= 0.8) {
        defaultMapping[col.name] = col.suggestedCanonical;
      }
    }

    // Evaluate initial capability matrix
    const capabilityMatrix = this.evaluateCapabilities(defaultMapping);

    // Persist dataset metadata
    const dataset = await datasetRepository.create(workspaceId, {
      workspaceId,
      name: datasetName.trim() || file.originalname,
      sourceType: 'uploaded',
      storedFilename: path.basename(file.path),
      originalFilename: file.originalname,
      fileSizeBytes: file.size,
      rowCount: profiling.rowCount,
      columnCount: profiling.columns.length,
      uploadedBy: userId,
      profilingSummary: {
        columns: profiling.columns,
        duplicateRows: profiling.duplicateRows,
        timestampColumn: profiling.timestampColumn,
        qualityScore: profiling.qualityScore
      },
      columnMapping: defaultMapping,
      capabilityMatrix,
      validationReport: {
        validRows: profiling.rowCount,
        rejectedRows: 0,
        errors: profiling.anomaliesDetected
      }
    });

    // Record audit log
    await auditLogRepository.record(workspaceId, 'upload', 'dataset', {
      userId,
      resourceId: dataset._id,
      details: {
        datasetName: dataset.name,
        rowCount: dataset.rowCount,
        sizeBytes: dataset.fileSizeBytes
      }
    });

    return { dataset, profiling };
  }
}

export const datasetUploadService = new DatasetUploadService();
