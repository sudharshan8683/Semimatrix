import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { datasetUploadService } from '../../src/services/datasetUpload.service.js';
import { AppError } from '../../src/errors/AppError.js';

describe('Stage 2: Dataset Upload, Profiling, Mapping & Capability Checks', () => {
  const tempDir = path.resolve(process.cwd(), 'tests_temp');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects macro-enabled .xlsm files and invalid extensions', () => {
    const fakeMacroFile = path.join(tempDir, 'sample.xlsm');
    fs.writeFileSync(fakeMacroFile, 'dummy content');

    expect(() => {
      datasetUploadService.validateFileMagic(fakeMacroFile, 'sample.xlsm');
    }).toThrowError(/macro-enabled/i);

    const fakeExe = path.join(tempDir, 'evil.exe');
    fs.writeFileSync(fakeExe, 'MZ9000');
    expect(() => {
      datasetUploadService.validateFileMagic(fakeExe, 'evil.exe');
    }).toThrowError(/invalid file extension/i);
  });

  it('detects and neutralizes formula injection in CSV cells (=, +, -, @)', async () => {
    const csvWithFormulas = [
      'timestamp,tool_id,chamber_temp,formula_val',
      '2026-10-14T10:00:00Z,ETCH-01,45.2,=cmd|"/C calc"!A0',
      '2026-10-14T10:05:00Z,ETCH-01,45.6,+10+20',
      '2026-10-14T10:10:00Z,ETCH-01,46.1,@SUM(A1:A10)'
    ].join('\n');

    const csvPath = path.join(tempDir, 'injection_test.csv');
    fs.writeFileSync(csvPath, csvWithFormulas, 'utf-8');

    const rows = await datasetUploadService.parseCsv(csvPath);
    expect(rows.length).toBe(3);

    // Formula injection payloads must be safely prefixed with an apostrophe
    expect(rows[0].formula_val).toBe('\'=cmd|"/C calc"!A0');
    expect(rows[1].formula_val).toBe('\'+10+20');
    expect(rows[2].formula_val).toBe('\'@SUM(A1:A10)');
  });

  it('accurately profiles data types, missing rates, and physical violations (e.g. negative pressure)', () => {
    const sampleRows = [
      { timestamp: '2026-10-14T10:00:00Z', chamber_pressure: '-12.5', temp_c: '400.1', constant_col: 'FAB1' },
      { timestamp: '2026-10-14T10:05:00Z', chamber_pressure: '45.0', temp_c: '402.3', constant_col: 'FAB1' },
      { timestamp: '2026-10-14T10:10:00Z', chamber_pressure: null, temp_c: '401.8', constant_col: 'FAB1' }
    ];

    const profiling = datasetUploadService.profileData(sampleRows);

    expect(profiling.rowCount).toBe(3);
    const pressureCol = profiling.columns.find((c) => c.name === 'chamber_pressure');
    expect(pressureCol).toBeDefined();
    expect(pressureCol?.detectedType).toBe('number');
    expect(pressureCol?.missingPercent).toBeGreaterThan(0);

    const constCol = profiling.columns.find((c) => c.name === 'constant_col');
    expect(constCol?.isConstant).toBe(true);

    // Anomaly tripwire: impossible negative pressure flagged
    expect(profiling.anomaliesDetected.some((a) => a.includes('negative pressure'))).toBe(true);
  });

  it('auto-maps semiconductor synonyms to canonical fields with high confidence', () => {
    const tempMatch = datasetUploadService.matchCanonicalField('chamber_temp');
    expect(tempMatch.field).toBe('temperature');
    expect(tempMatch.confidence).toBeGreaterThanOrEqual(0.8);

    const pressMatch = datasetUploadService.matchCanonicalField('press_mtorr');
    expect(pressMatch.field).toBe('pressure');
    expect(pressMatch.confidence).toBeGreaterThanOrEqual(0.8);

    const lotMatch = datasetUploadService.matchCanonicalField('carrier_id');
    expect(lotMatch.field).toBe('wafer_lot_id');
    expect(lotMatch.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('blocks yield and maintenance predictions on temperature-only datasets with explicit explanations (Criterion 4)', () => {
    // Temperature-only mapping
    const tempOnlyMapping = {
      timestamp: 'timestamp',
      sensor_1: 'temperature'
    };

    const capability = datasetUploadService.evaluateCapabilities(tempOnlyMapping);

    // SPC is Available because timestamp and a numeric parameter exist
    expect(capability.spcControl.available).toBe(true);
    expect(capability.spcControl.status).toBe('available');

    // Yield Analysis is BLOCKED because production counts are absent
    expect(capability.yieldAnalysis.available).toBe(false);
    expect(capability.yieldAnalysis.status).toBe('blocked');
    expect(capability.yieldAnalysis.missingFields).toContain('total_units');
    expect(capability.yieldAnalysis.explanation).toMatch(/cannot compute yield from telemetry alone/i);

    // Predictive Maintenance is BLOCKED because equipmentId and failure labels are absent
    expect(capability.predictiveMaintenance.available).toBe(false);
    expect(capability.predictiveMaintenance.status).toBe('blocked');
    expect(capability.predictiveMaintenance.missingFields).toContain('equipment_id');

    // Lot Traceability is BLOCKED because wafer_lot_id is absent
    expect(capability.lotTraceability.available).toBe(false);
    expect(capability.lotTraceability.status).toBe('blocked');
  });

  it('enables all capabilities when a complete production dataset is mapped', () => {
    const fullMapping = {
      ts: 'timestamp',
      tool: 'equipment_id',
      lot: 'wafer_lot_id',
      total_wafers: 'total_units',
      good_wafers: 'good_units',
      temp: 'temperature',
      press: 'pressure',
      failure_flag: 'failure_label'
    };

    const capability = datasetUploadService.evaluateCapabilities(fullMapping);

    expect(capability.yieldAnalysis.status).toBe('available');
    expect(capability.spcControl.status).toBe('available');
    expect(capability.anomalyDetection.status).toBe('available');
    expect(capability.predictiveMaintenance.status).toBe('available');
    expect(capability.lotTraceability.status).toBe('available');
  });
});
