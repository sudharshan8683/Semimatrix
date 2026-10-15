import fs from 'fs';
import path from 'path';
import { IParameterSpec, EquipmentType } from '../models/Equipment.js';
import { InjectedEventType } from '../models/InjectedEvent.js';
import { equipmentRepository } from '../repositories/equipment.repository.js';
import { sensorRepository } from '../repositories/sensor.repository.js';
import { lotRepository } from '../repositories/lot.repository.js';
import { injectedEventRepository } from '../repositories/injectedEvent.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { datasetRepository } from '../repositories/dataset.repository.js';

export type SyntheticScenario = 'all' | 'normal' | 'drift' | 'fault' | 'yield_loss' | 'spike' | 'excursion';

export interface GeneratorConfig {
  seed?: number;
  days?: number;
  toolCountPerType?: number; // default 3 tools each (15 total)
  scenario?: SyntheticScenario;
  intervalMinutes?: number; // default 15 mins
}

export interface GeneratedResult {
  equipmentCount: number;
  readingCount: number;
  lotCount: number;
  injectedEventCount: number;
  csvContent: string;
  scenario: string;
  targetFinding: {
    title: string;
    description: string;
    route: string;
  };
  datasetId?: string;
}

// Pseudo-random number generator for reproducible seeding (Mulberry32)
class SeededRandom {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Gaussian noise via Box-Muller transform
  gaussian(mean = 0, stdev = 1): number {
    const u1 = Math.max(1e-15, this.next());
    const u2 = this.next();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdev;
  }
}

export const EQUIPMENT_SPECS: Record<EquipmentType, { bay: string; stage: string; params: IParameterSpec[] }> = {
  deposition_cvd: {
    bay: 'Bay-01 CVD Bay',
    stage: 'CVD Dielectric Deposition',
    params: [
      { name: 'temperature', unit: 'degC', nominal: 400.0, usl: 415.0, lsl: 385.0, ucl: 407.5, lcl: 392.5, cl: 400.0, rangeMin: 350.0, rangeMax: 450.0 },
      { name: 'pressure', unit: 'mTorr', nominal: 2500.0, usl: 2650.0, lsl: 2350.0, ucl: 2575.0, lcl: 2425.0, cl: 2500.0, rangeMin: 2000.0, rangeMax: 3000.0 },
      { name: 'rf_power', unit: 'W', nominal: 650.0, usl: 690.0, lsl: 610.0, ucl: 670.0, lcl: 630.0, cl: 650.0, rangeMin: 550.0, rangeMax: 750.0 },
      { name: 'gas_flow', unit: 'sccm', nominal: 180.0, usl: 195.0, lsl: 165.0, ucl: 187.5, lcl: 172.5, cl: 180.0, rangeMin: 140.0, rangeMax: 220.0 }
    ]
  },
  lithography_track: {
    bay: 'Bay-02 Litho Bay',
    stage: 'Photolithography & Coat',
    params: [
      { name: 'temperature', unit: 'degC', nominal: 21.5, usl: 22.5, lsl: 20.5, ucl: 22.0, lcl: 21.0, cl: 21.5, rangeMin: 18.0, rangeMax: 25.0 },
      { name: 'spin_speed', unit: 'RPM', nominal: 3000.0, usl: 3050.0, lsl: 2950.0, ucl: 3025.0, lcl: 2975.0, cl: 3000.0, rangeMin: 2800.0, rangeMax: 3200.0 },
      { name: 'resist_dispense', unit: 'mL', nominal: 1.85, usl: 1.95, lsl: 1.75, ucl: 1.90, lcl: 1.80, cl: 1.85, rangeMin: 1.5, rangeMax: 2.2 },
      { name: 'humidity', unit: '%RH', nominal: 45.0, usl: 48.0, lsl: 42.0, ucl: 46.5, lcl: 43.5, cl: 45.0, rangeMin: 35.0, rangeMax: 55.0 }
    ]
  },
  etch: {
    bay: 'Bay-03 Plasma Etch Bay',
    stage: 'Reactive Ion Etch (RIE)',
    params: [
      { name: 'pressure', unit: 'mTorr', nominal: 45.0, usl: 52.0, lsl: 38.0, ucl: 48.5, lcl: 41.5, cl: 45.0, rangeMin: 30.0, rangeMax: 60.0 },
      { name: 'bias_voltage', unit: 'V', nominal: -320.0, usl: -300.0, lsl: -340.0, ucl: -310.0, lcl: -330.0, cl: -320.0, rangeMin: -360.0, rangeMax: -280.0 },
      { name: 'chlorine_flow', unit: 'sccm', nominal: 85.0, usl: 92.0, lsl: 78.0, ucl: 88.5, lcl: 81.5, cl: 85.0, rangeMin: 70.0, rangeMax: 100.0 },
      { name: 'vibration', unit: 'mm/s RMS', nominal: 0.42, usl: 0.85, lsl: 0.10, ucl: 0.65, lcl: 0.20, cl: 0.42, rangeMin: 0.05, rangeMax: 1.50 }
    ]
  },
  ion_implant: {
    bay: 'Bay-04 Ion Beam Bay',
    stage: 'High-Current Implantation',
    params: [
      { name: 'beam_current', unit: 'mA', nominal: 15.0, usl: 16.5, lsl: 13.5, ucl: 15.75, lcl: 14.25, cl: 15.0, rangeMin: 10.0, rangeMax: 20.0 },
      { name: 'accel_voltage', unit: 'kV', nominal: 80.0, usl: 84.0, lsl: 76.0, ucl: 82.0, lcl: 78.0, cl: 80.0, rangeMin: 70.0, rangeMax: 90.0 },
      { name: 'chamber_vacuum', unit: 'uTorr', nominal: 1.20, usl: 1.80, lsl: 0.80, ucl: 1.50, lcl: 0.90, cl: 1.20, rangeMin: 0.50, rangeMax: 2.50 },
      { name: 'cryo_temp', unit: 'K', nominal: 12.5, usl: 16.0, lsl: 10.0, ucl: 14.2, lcl: 11.0, cl: 12.5, rangeMin: 8.0, rangeMax: 20.0 }
    ]
  },
  cmp: {
    bay: 'Bay-05 Planarization Bay',
    stage: 'Chemical Mechanical Polishing',
    params: [
      { name: 'platen_speed', unit: 'RPM', nominal: 92.0, usl: 98.0, lsl: 86.0, ucl: 95.0, lcl: 89.0, cl: 92.0, rangeMin: 80.0, rangeMax: 105.0 },
      { name: 'downforce', unit: 'PSI', nominal: 4.20, usl: 4.70, lsl: 3.70, ucl: 4.45, lcl: 3.95, cl: 4.20, rangeMin: 3.0, rangeMax: 5.5 },
      { name: 'slurry_flow', unit: 'mL/min', nominal: 180.0, usl: 200.0, lsl: 160.0, ucl: 190.0, lcl: 170.0, cl: 180.0, rangeMin: 140.0, rangeMax: 220.0 },
      { name: 'vibration', unit: 'mm/s RMS', nominal: 0.65, usl: 1.10, lsl: 0.20, ucl: 0.90, lcl: 0.40, cl: 0.65, rangeMin: 0.10, rangeMax: 1.80 }
    ]
  }
};

export class SyntheticGeneratorService {
  async generateAndPersist(workspaceId: string, config: GeneratorConfig = {}): Promise<GeneratedResult> {
    const seed = config.seed ?? 42;
    const days = config.days ?? 7;
    const toolCount = config.toolCountPerType ?? 3;
    const intervalMinutes = config.intervalMinutes ?? 15;
    const rng = new SeededRandom(seed);

    const startTime = new Date(Date.now() - days * 24 * 3600 * 1000);
    const endTime = new Date();

    // 1. Provision 15 Tools across 5 Equipment Types
    const toolTypes: EquipmentType[] = ['deposition_cvd', 'lithography_track', 'etch', 'ion_implant', 'cmp'];
    const equipmentMap: Record<EquipmentType, Array<{ id: string; name: string }>> = {
      deposition_cvd: [],
      lithography_track: [],
      etch: [],
      ion_implant: [],
      cmp: []
    };

    let totalTools = 0;
    for (const type of toolTypes) {
      const typeInfo = EQUIPMENT_SPECS[type];
      for (let i = 1; i <= toolCount; i++) {
        const eqId = `${type.toUpperCase().slice(0, 4)}-0${i}`;
        const name = `${type.replace('_', ' ').toUpperCase()} Tool #${i}`;
        
        await equipmentRepository.create(workspaceId, {
          workspaceId,
          equipmentId: eqId,
          name,
          type,
          locationBay: typeInfo.bay,
          status: 'processing',
          parameters: typeInfo.params,
          sourceType: 'synthetic'
        });

        equipmentMap[type].push({ id: eqId, name });
        totalTools++;
      }
    }

    const scenario = config.scenario ?? 'all';
    const isDriftActive = scenario === 'all' || scenario === 'drift';
    const isSpikeActive = scenario === 'all' || scenario === 'fault' || scenario === 'spike';
    const isYieldLossActive = scenario === 'all' || scenario === 'yield_loss' || scenario === 'excursion';

    // 2. Injected Anomalies (Ground Truth)
    let injectedEventCount = 0;
    const driftStart = new Date(startTime.getTime() + 2 * 24 * 3600 * 1000);
    const driftEnd = new Date(driftStart.getTime() + 48 * 3600 * 1000);
    const spikeStart = new Date(startTime.getTime() + 4 * 24 * 3600 * 1000);
    const spikeEnd = new Date(spikeStart.getTime() + 4 * 3600 * 1000);
    const excStart = new Date(startTime.getTime() + 5 * 24 * 3600 * 1000);
    const excEnd = new Date(excStart.getTime() + 12 * 3600 * 1000);

    if (isDriftActive) {
      await injectedEventRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'DEPO-01',
        eventType: 'gradual_drift',
        description: 'CVD chamber temperature gradual drift (+0.25 degC/hr) due to heater coil degradation',
        startTime: driftStart,
        endTime: driftEnd,
        affectedParameters: ['temperature'],
        severity: 'high',
        expectedLeadTimeHours: 24,
        isDetected: false
      });
      injectedEventCount++;
    }

    if (isSpikeActive) {
      await injectedEventRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'ETCH-02',
        eventType: 'sudden_spike',
        description: 'Chamber pressure spike on ETCH-02 due to throttle valve micro-sticking',
        startTime: spikeStart,
        endTime: spikeEnd,
        affectedParameters: ['pressure'],
        severity: 'critical',
        expectedLeadTimeHours: 2,
        isDetected: false
      });
      injectedEventCount++;
    }

    if (isYieldLossActive) {
      await injectedEventRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'CMP-01',
        lotId: 'LOT-2610-08',
        eventType: 'contamination_yield_excursion',
        description: 'Slurry delivery aggregate contamination during CMP phase causing micro-scratches and severe yield loss',
        startTime: excStart,
        endTime: excEnd,
        affectedParameters: ['slurry_flow', 'vibration'],
        severity: 'critical',
        expectedLeadTimeHours: 6,
        isDetected: false
      });
      injectedEventCount++;
    }

    // 3. Generate Wafer Lots
    const lotCount = 28;
    const generatedLots: any[] = [];
    const stepDurationMs = 4 * 3600 * 1000; // 4 hours per process stage

    for (let l = 1; l <= lotCount; l++) {
      const lotId = `LOT-2610-${l.toString().padStart(2, '0')}`;
      const lotStart = new Date(startTime.getTime() + l * 5 * 3600 * 1000);
      const isExcursionLot = isYieldLossActive && lotId === 'LOT-2610-08';

      const totalUnits = 25; // standard 25-wafer FOUP
      let goodUnits = isExcursionLot ? 16 : (rng.next() > 0.15 ? 24 : 23);
      let defectCount = totalUnits - goodUnits;
      let yieldPercent = Number(((goodUnits / totalUnits) * 100).toFixed(2));

      const stages: any[] = [];
      let currentStageTime = lotStart;

      for (const type of toolTypes) {
        const spec = EQUIPMENT_SPECS[type];
        const chosenTool = equipmentMap[type][l % toolCount];
        const stageEnd = new Date(currentStageTime.getTime() + stepDurationMs);

        const stageDefects = isExcursionLot && type === 'cmp' ? 8 : (rng.next() > 0.8 ? 1 : 0);

        stages.push({
          stage: spec.stage,
          equipmentId: chosenTool.id,
          startTime: currentStageTime,
          endTime: stageEnd,
          status: stageDefects > 4 ? 'failed' : stageDefects > 0 ? 'warning' : 'passed',
          defectsDetected: stageDefects
        });

        currentStageTime = stageEnd;
      }

      const lotDoc = await lotRepository.create(workspaceId, {
        workspaceId,
        lotId,
        recipeId: `RECIPE-GEN5-A${(l % 3) + 1}`,
        totalUnits,
        goodUnits,
        defectCount,
        yieldPercent,
        startTime: lotStart,
        endTime: currentStageTime,
        currentStage: stages[stages.length - 1].stage,
        status: yieldPercent < 75 ? 'scrapped' : 'completed',
        stages,
        sourceType: 'synthetic'
      });

      generatedLots.push(lotDoc);
    }

    // 4. Generate Telemetry Time Series for all tools
    const csvRows: string[] = [];
    csvRows.push(
      '# SOURCE_TYPE: synthetic | DATASET: Semimatrix Demo Baseline | REPRODUCIBLE_SEED: ' + seed
    );
    csvRows.push(
      'timestamp,equipment_id,equipment_type,wafer_lot_id,process_stage,parameter_name,parameter_value,unit,equipment_status'
    );

    let totalReadings = 0;
    const intervalMs = intervalMinutes * 60 * 1000;
    const totalSteps = Math.min(250, Math.floor((endTime.getTime() - startTime.getTime()) / intervalMs));

    const sensorBatch: any[] = [];

    for (const type of toolTypes) {
      const typeInfo = EQUIPMENT_SPECS[type];
      const tools = equipmentMap[type];

      for (const tool of tools) {
        let prevValues: Record<string, number> = {};
        for (const p of typeInfo.params) {
          prevValues[p.name] = p.nominal;
        }

        for (let s = 0; s < totalSteps; s++) {
          const stepTime = new Date(startTime.getTime() + s * intervalMs);
          const metrics: Record<string, number> = {};

          // Check if this tool is processing any lot at this timestamp
          const activeLot = generatedLots.find((lot) =>
            lot.stages.some(
              (st: any) =>
                st.equipmentId === tool.id &&
                stepTime.getTime() >= new Date(st.startTime).getTime() &&
                stepTime.getTime() <= new Date(st.endTime).getTime()
            )
          );

          let isAnomaly = false;

          for (const param of typeInfo.params) {
            let val = prevValues[param.name];

            // AR(1) Mean-reverting noise
            const noise = rng.gaussian(0, (param.usl - param.nominal) * 0.08);
            val = param.nominal + 0.65 * (val - param.nominal) + noise;

            // Scenario Injections:
            // 1. Drift on DEPO-01 temperature
            if (isDriftActive && tool.id === 'DEPO-01' && param.name === 'temperature') {
              if (stepTime >= driftStart && stepTime <= driftEnd) {
                const hoursIntoDrift = (stepTime.getTime() - driftStart.getTime()) / (3600 * 1000);
                val += hoursIntoDrift * 0.35; // Climbs into > UCL
                isAnomaly = true;
              }
            }

            // 2. Spike on ETCH-02 pressure
            if (isSpikeActive && tool.id === 'ETCH-02' && param.name === 'pressure') {
              if (stepTime >= spikeStart && stepTime <= spikeEnd) {
                val += 8.5; // Tripwire
                isAnomaly = true;
              }
            }

            // 3. Vibration & Slurry anomaly on CMP-01
            if (isYieldLossActive && tool.id === 'CMP-01' && (param.name === 'slurry_flow' || param.name === 'vibration')) {
              if (stepTime >= excStart && stepTime <= excEnd) {
                if (param.name === 'slurry_flow') val -= 35;
                if (param.name === 'vibration') val += 0.45;
                isAnomaly = true;
              }
            }

            // Bound by physics
            val = Math.max(param.rangeMin, Math.min(param.rangeMax, val));
            prevValues[param.name] = val;
            metrics[param.name] = Number(val.toFixed(3));

            // Append CSV row
            csvRows.push(
              `${stepTime.toISOString()},'${tool.id}',${type},'${activeLot ? activeLot.lotId : ''}',${typeInfo.stage},${param.name},${metrics[param.name]},${param.unit},${activeLot ? 'processing' : 'idle'}`
            );
          }

          sensorBatch.push({
            workspaceId,
            equipmentId: tool.id,
            timestamp: stepTime,
            stage: typeInfo.stage,
            lotId: activeLot ? activeLot.lotId : undefined,
            sourceType: 'synthetic',
            metrics,
            status: activeLot ? 'processing' : 'idle',
            isAnomaly
          });

          totalReadings++;
        }
      }
    }

    // Batch insert sensor readings
    await sensorRepository.insertBatch(workspaceId, sensorBatch);

    // Create realistic alerts triggered by the selected scenario
    if (isDriftActive) {
      await alertRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'DEPO-01',
        severity: 'critical',
        state: 'open',
        title: 'Statistical Control Limit Violation: Chamber Temperature',
        description: 'DEPO-01 chamber temperature exceeded upper control limit (UCL: 407.5 degC) for 6 consecutive points. Suspected heater degradation.',
        parameterName: 'temperature',
        actualValue: 409.8,
        thresholdValue: 407.5,
        ruleViolated: 'Nelson Rule 3: 6 consecutive points increasing',
        sourceType: 'synthetic'
      });
    }

    if (isSpikeActive) {
      await alertRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'ETCH-02',
        severity: 'critical',
        state: 'open',
        title: 'Chamber Pressure Over-Limit Tripwire',
        description: 'ETCH-02 chamber pressure spiked to 53.8 mTorr (USL: 52.0 mTorr). Throttle valve check recommended.',
        parameterName: 'pressure',
        actualValue: 53.8,
        thresholdValue: 52.0,
        ruleViolated: 'Nelson Rule 1: Point outside 3-sigma limits',
        sourceType: 'synthetic'
      });
    }

    if (isYieldLossActive) {
      await alertRepository.create(workspaceId, {
        workspaceId,
        equipmentId: 'CMP-01',
        severity: 'critical',
        state: 'open',
        title: 'Wafer Yield Excursion: CMP Slurry Delivery Drop',
        description: 'CMP-01 slurry flow dropped 24% causing micro-scratch defect excursion on LOT-2610-08.',
        parameterName: 'slurry_flow',
        actualValue: 152.4,
        thresholdValue: 180.0,
        ruleViolated: 'Nelson Rule 2: 9 consecutive points below center line',
        sourceType: 'synthetic'
      });
    }

    // Save generated CSV to uploads directory
    const csvContent = csvRows.join('\n');
    try {
      const uploadDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, `sample_${workspaceId}.csv`), csvContent, 'utf-8');
      fs.writeFileSync(path.join(uploadDir, 'semimatrix_seeded_demo.csv'), csvContent, 'utf-8');
    } catch (e) {
      // ignore fs errors if environment is read-only
    }

    // Persist as managed dataset in workspace
    const dataset = await datasetRepository.create(workspaceId, {
      workspaceId,
      name: `Sample Cleanroom Telemetry (${scenario.toUpperCase()})`,
      sourceType: 'synthetic',
      rowCount: totalReadings,
      columnCount: 18,
      status: 'analyzed',
      columnMapping: {
        timestamp: 'timestamp',
        equipment_id: 'equipment_id',
        equipment_type: 'equipment_type',
        wafer_lot_id: 'wafer_lot_id',
        process_stage: 'process_stage',
        temperature: 'temperature',
        pressure: 'pressure',
        vibration: 'vibration',
        current: 'current',
        total_units: 'total_units',
        good_units: 'good_units',
        defect_count: 'defect_count',
        equipment_status: 'equipment_status',
        downtime: 'downtime'
      },
      capabilityMatrix: {
        yieldAnalysis: { status: 'available', missingFields: [] },
        spcRunCharts: { status: 'available', missingFields: [] },
        maintenanceRisk: { status: 'available', missingFields: [] },
        supervisedFailurePrediction: { status: 'blocked', missingFields: ['failure_label (≥ 30 confirmed events required)'] },
        lotToToolCorrelation: { status: 'available', missingFields: [] }
      }
    });

    let targetFinding = {
      title: 'Nominal Operations Baseline',
      description: 'Cleanroom tools operating within normal 3-sigma specifications with 96.8% line yield.',
      route: '/overview'
    };

    if (scenario === 'drift') {
      targetFinding = {
        title: 'Gradual Equipment Temperature Drift',
        description: 'DEPO-01 heater coil degradation causing +0.25 degC/hr thermal creep over 48 hours.',
        route: '/equipment?selected=DEPO-01'
      };
    } else if (scenario === 'fault' || scenario === 'spike') {
      targetFinding = {
        title: 'Sudden Vacuum Throttle Fault',
        description: 'ETCH-02 throttle valve micro-sticking triggering an instantaneous pressure surge to 53.8 mTorr.',
        route: '/alerts'
      };
    } else if (scenario === 'yield_loss' || scenario === 'excursion') {
      targetFinding = {
        title: 'Wafer Lot Yield Excursion (Scrap Event)',
        description: 'CMP-01 slurry delivery drop causing mechanical micro-scratching on LOT-2610-08 with 36% scrap.',
        route: '/yield'
      };
    } else if (scenario === 'all') {
      targetFinding = {
        title: 'Multi-Scenario Cleanroom Simulation',
        description: '3 injected anomalies: DEPO-01 thermal drift, ETCH-02 pressure spike, and CMP-01 lot excursion.',
        route: '/overview'
      };
    }

    return {
      equipmentCount: totalTools,
      readingCount: totalReadings,
      lotCount,
      injectedEventCount,
      csvContent,
      scenario,
      targetFinding,
      datasetId: (dataset as any)._id || (dataset as any).id
    };
  }
}

export const syntheticGeneratorService = new SyntheticGeneratorService();
