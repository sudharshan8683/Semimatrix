import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import {
  Sparkles,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  Shield,
  Activity,
  Check,
  HelpCircle
} from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step: 1 (Source), 2 (Scenario/Upload), 3 (Capability Check), 4 (Launch)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selected Path
  const [dataSource, setDataSource] = useState<'sample' | 'upload'>('sample');

  // Scenario Selection (for Sample Data)
  const [selectedScenario, setSelectedScenario] = useState<'drift' | 'fault' | 'yield_loss' | 'normal'>('drift');
  const [seed, setSeed] = useState<number>(42);

  // Execution state
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState<any | null>(null);

  const scenarios = [
    {
      id: 'drift' as const,
      name: 'Gradual Equipment Performance Drift',
      toolAffected: 'LPCVD Furnace (DEPO-01)',
      whatHappens: 'Chamber thermocouple heater temperature drifts upward (+0.42 °C/day) over 6 consecutive production runs.',
      outcome: 'Triggered by SPC Nelson Rule 3; proactive thermocouple inspection recommendation.',
      badge: 'Equipment Maintenance Focus',
      route: '/equipment?selected=DEPO-01'
    },
    {
      id: 'fault' as const,
      name: 'Sudden Chamber Pressure Excursion',
      toolAffected: 'Plasma Etcher (ETCH-02)',
      whatHappens: 'Throttle valve micro-sticking causes a sudden pressure spike to 53.8 mTorr during poly-silicon gate etch.',
      outcome: 'Flagged by Nelson Rule 1 (>3-sigma excursion); immediate dry clean cycle recommended.',
      badge: 'Incident Response Focus',
      route: '/investigations?tool=ETCH-02'
    },
    {
      id: 'yield_loss' as const,
      name: 'Contaminated Lot & Yield Drop',
      toolAffected: 'CMP Polisher (CMP-01) & Lot W-904',
      whatHappens: 'Slurry flow delivery rate drops 24%, resulting in increased micro-scratch defects on 25 production wafers.',
      outcome: 'Identified in stage-by-stage defect decomposition; root cause ranked by effect size (Cohen’s d).',
      badge: 'Quality & Yield Focus',
      route: '/yield'
    },
    {
      id: 'normal' as const,
      name: 'Nominal Cleanroom Baseline Operation',
      toolAffected: 'Fleet-wide (15 Tools across 5 Bays)',
      whatHappens: 'All CVD, Etch, Lithography, CMP, and Implant tools operate strictly within nominal statistical control limits.',
      outcome: 'High line availability (96.2%), 94.8% wafer lot yield, zero critical alarms.',
      badge: 'Cleanroom Baseline Focus',
      route: '/overview'
    }
  ];

  const handleGenerateSample = async () => {
    if (generating) return;
    setGenerating(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/datasets/generate-synthetic', {
        seed,
        days: 7,
        toolCountPerType: 3,
        scenario: selectedScenario
      });

      const data = res.data.data;
      setGenSuccess(data);
      localStorage.setItem('semimatrix_onboarding_dismissed', 'true');

      // Navigate to destination
      setTimeout(() => {
        if (data.targetFinding?.route) {
          navigate(data.targetFinding.route);
        } else {
          const scenarioObj = scenarios.find((s) => s.id === selectedScenario);
          navigate(scenarioObj ? scenarioObj.route : '/overview');
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to generate cleanroom scenario.');
      setGenerating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('semimatrix_onboarding_dismissed', 'true');
    navigate('/overview');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2 font-sans text-xs">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Semimatrix Guided Setup
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-sky-300 border border-navy-200 dark:border-navy-800 uppercase">
              First-Run Wizard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans">
            Configure your cleanroom telemetry source to start analyzing equipment health, SPC control limits, and wafer-lot yield.
          </p>
        </div>

        <button
          onClick={handleSkip}
          className="px-3.5 py-1.5 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-medium transition-colors shadow-sm self-start md:self-auto shrink-0"
        >
          Skip to Overview →
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Data Source', subtitle: 'Simulated vs Factory Data' },
            { step: 2, title: 'Scenario / File', subtitle: 'Select Scenario or File' },
            { step: 3, title: 'Capability Check', subtitle: 'Verify Analytics Scope' },
            { step: 4, title: 'Launch Results', subtitle: 'View Operations Dashboard' }
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <div
                key={s.step}
                className={`p-2.5 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-[#16324F] dark:border-sky-400 bg-slate-50/80 dark:bg-slate-800/60'
                    : isCompleted
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-transparent text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-[#16324F] dark:bg-sky-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check size={11} /> : s.step}
                  </div>
                  <span className={`font-semibold text-xs truncate ${isCurrent ? 'text-slate-900 dark:text-white' : ''}`}>
                    {s.title}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                  {s.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: CHOOSE DATA SOURCE */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Explore with Sample Data */}
            <div
              onClick={() => setDataSource('sample')}
              className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex flex-col justify-between ${
                dataSource === 'sample'
                  ? 'border-[#16324F] dark:border-sky-400 bg-white dark:bg-[#131D31] shadow-md'
                  : 'border-[#E4E7EC] dark:border-[#1E2D4A] bg-white/70 dark:bg-[#131D31]/70 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <Sparkles size={20} />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200">
                    Recommended For Evaluation
                  </span>
                </div>

                <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-1.5">
                  Explore with Simulated Cleanroom Data
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  Instantly provisions 15 cleanroom equipment tools (CVD, Etch, Litho, CMP, Implant) across 7 days with reproducible sensor noise and injected ground-truth excursions.
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18243C] text-[11px] text-slate-600 dark:text-slate-300 border border-[#E4E7EC] dark:border-[#1E2D4A] space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Transparency Note:</div>
                  <div>This data is generated by a deterministic physics simulation. It does not represent actual factory telemetry or claim proof of real-world model accuracy.</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-[#1E2D4A] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Deterministic Seed: #42</span>
                <span className="text-xs font-semibold text-[#16324F] dark:text-sky-400 flex items-center gap-1">
                  <span>Select & Continue</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>

            {/* Option B: Analyze My Factory Data */}
            <div
              onClick={() => setDataSource('upload')}
              className={`cursor-pointer rounded-xl p-5 border-2 transition-all flex flex-col justify-between ${
                dataSource === 'upload'
                  ? 'border-[#16324F] dark:border-sky-400 bg-white dark:bg-[#131D31] shadow-md'
                  : 'border-[#E4E7EC] dark:border-[#1E2D4A] bg-white/70 dark:bg-[#131D31]/70 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-400">
                    <Upload size={20} />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200">
                    Production CSV / XLSX
                  </span>
                </div>

                <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-1.5">
                  Analyze My Factory Cleanroom Data
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  Upload your cleanroom sensor telemetry, wafer lot tracking sheets, or metrology defect logs in standard CSV or Excel formats.
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18243C] text-[11px] text-slate-600 dark:text-slate-300 border border-[#E4E7EC] dark:border-[#1E2D4A] space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Security & Isolation:</div>
                  <div>Uploaded data is cryptographically isolated to your workspace. Macro files (.xlsm) are rejected, and formulas are automatically defanged.</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-[#1E2D4A] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Accepted: .csv, .xlsx (&lt;25MB)</span>
                <span className="text-xs font-semibold text-[#16324F] dark:text-sky-400 flex items-center gap-1">
                  <span>Select & Continue</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-[#16324F] hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>Next: Configure {dataSource === 'sample' ? 'Scenario' : 'Dataset'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT SCENARIO OR UPLOAD FILE */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {dataSource === 'sample' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                    Select a Cleanroom Engineering Scenario
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Each scenario injects realistic statistical deviations to demonstrate specific detection capabilities.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Random Seed:</span>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-white dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded text-slate-900 dark:text-white font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {scenarios.map((s) => {
                  const isSelected = selectedScenario === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedScenario(s.id)}
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#16324F] dark:border-sky-400 bg-white dark:bg-[#131D31] shadow-md'
                          : 'border-[#E4E7EC] dark:border-[#1E2D4A] bg-white/70 dark:bg-[#131D31]/70 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-bold text-xs text-slate-900 dark:text-white">
                            {s.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isSelected
                              ? 'bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-sky-300 border-navy-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                          }`}>
                            {s.badge}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                          <strong className="text-slate-700 dark:text-slate-300 font-semibold">Affected Equipment:</strong> {s.toolAffected}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                          <strong className="text-slate-700 dark:text-slate-200 font-medium">What Happens:</strong> {s.whatHappens}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E4E7EC] dark:border-[#1E2D4A] text-[11px] text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300 font-medium">Outcome:</strong> {s.outcome}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Upload File Workflow Prompt */
            <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-6 space-y-4">
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 text-sky-700 dark:text-sky-400 flex items-center justify-center mx-auto">
                  <Upload size={22} />
                </div>
                <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                  Upload Cleanroom File & Column Mapping
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You can upload standard CSV or Excel files. Our 3-step ingest engine checks magic bytes, defangs formula injection, and auto-suggests canonical column mappings.
                </p>
              </div>

              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Ready to map and validate your custom file schema?
                </p>
                <Link
                  to="/datasets"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16324F] hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm"
                >
                  <Upload size={14} />
                  <span>Open Datasets & Mapping Center →</span>
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            {dataSource === 'sample' && (
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 bg-[#16324F] hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Next: Review Analytics Capabilities</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: CAPABILITY VERIFICATION & SCOPE REVIEW */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                Analysis Capability Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review the analytical capabilities supported for the selected cleanroom telemetry dataset:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                {
                  title: 'Shewhart I-Charts & Nelson Rules',
                  description: 'Phase I baseline control limits with Nelson Rules 1–4 automated tripwires.',
                  status: 'Supported',
                  color: 'text-emerald-700 dark:text-emerald-400'
                },
                {
                  title: 'Wafer Lot Yield Loss Decomposition',
                  description: 'Stage-by-stage defect attribution across CVD, Etch, Litho, CMP, and Implant.',
                  status: 'Supported',
                  color: 'text-emerald-700 dark:text-emerald-400'
                },
                {
                  title: 'Predictive Equipment Degradation',
                  description: 'Rolling drift slope and anomaly scoring across all 15 cleanroom chambers.',
                  status: 'Supported',
                  color: 'text-emerald-700 dark:text-emerald-400'
                },
                {
                  title: 'Root-Cause Factor Attribution',
                  description: 'Standardized effect size ranking (Cohen’s d) with non-causal verification checklist.',
                  status: 'Supported',
                  color: 'text-emerald-700 dark:text-emerald-400'
                },
                {
                  title: 'SECS/GEM Hardware Write-Back',
                  description: 'Real-time equipment setpoint overrides or recipe adjustments.',
                  status: 'Strictly Prohibited (Advisory Only)',
                  color: 'text-slate-500'
                },
                {
                  title: 'Defanged Audit Reporting',
                  description: 'Plain-language summaries and formula-sanitized CSV exports.',
                  status: 'Supported',
                  color: 'text-emerald-700 dark:text-emerald-400'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-slate-50/60 dark:bg-[#18243C]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</span>
                    <span className={`font-medium text-[10px] ${item.color}`}>{item.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 bg-[#16324F] hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>Next: Launch Cleanroom Analytics</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: LAUNCH & VIEW RESULTS */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-6 shadow-sm space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
              Ready to Launch Fab Intelligence Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selected Scenario: <strong className="text-slate-800 dark:text-slate-200">{scenarios.find(s => s.id === selectedScenario)?.name}</strong>
            </p>
          </div>

          <div className="max-w-md mx-auto p-3.5 bg-slate-50 dark:bg-[#18243C] rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] text-[11px] text-slate-600 dark:text-slate-300 text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Fleet Scope:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">15 Tools (CVD, Etch, Litho, CMP, Implant)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">History Duration:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">7 Days (15,120 readings @ 15m intervals)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Focus:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{scenarios.find(s => s.id === selectedScenario)?.toolAffected}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={generating}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
            >
              Back to Review
            </button>

            <button
              onClick={handleGenerateSample}
              disabled={generating}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#16324F] hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Cleanroom Telemetry...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Generate & Launch Workspace</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
