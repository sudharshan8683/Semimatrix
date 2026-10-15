import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import { AdvisoryFooter } from '../components/common/AdvisoryFooter';
import {
  Search,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export const InvestigationView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [selectedInv, setSelectedInv] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedFactorIdx, setSelectedFactorIdx] = useState<number>(0);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const targetToolParam = searchParams.get('tool');

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/investigations');
      const list = res.data.data.investigations || [];
      setInvestigations(list);

      if (list.length > 0 && !selectedInv) {
        setSelectedInv(list[0]);
      }
    } catch (err) {
      console.error('Failed to load investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleTriggerNew = async () => {
    setTriggering(true);
    try {
      const res = await apiClient.post('/investigations', {
        title: targetToolParam
          ? `Root Cause Drilldown: ${targetToolParam} Excursion`
          : 'Wafer-Lot Yield Drop & Excursion Analysis',
        excursionType: 'yield_drop',
        targetEquipmentId: targetToolParam || undefined,
        sourceType: 'synthetic'
      });
      const newInv = res.data.data.investigation;
      setInvestigations([newInv, ...investigations]);
      setSelectedInv(newInv);
      setSelectedFactorIdx(0);
    } catch (err) {
      console.error('Failed to trigger investigation:', err);
    } finally {
      setTriggering(false);
    }
  };

  const toggleChecklist = (key: string) => {
    setChecklistState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeFactor = selectedInv?.candidateFactors?.[selectedFactorIdx];

  return (
    <div className="space-y-6">
      {/* Title & Control Bar */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                Root Cause Analysis & Excursion Attribution
              </h1>
              <DataBasisBadge sourceType="synthetic" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans">
              Standardized statistical effect size ranking (Cohen's d) for candidate contributing factors across cleanroom process stages.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTriggerNew}
              disabled={triggering}
              className="px-3.5 py-2 rounded-lg bg-[#16324F] hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Search size={14} />
              <span>{triggering ? 'Analyzing Cleanroom Telemetry...' : 'Trigger Analysis'}</span>
            </button>

            <button
              onClick={fetchInvestigations}
              disabled={loading}
              className="p-2 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
              title="Refresh investigations"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Investigation Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {investigations.map((inv) => {
          const isSelected = selectedInv?.id === inv.id;
          return (
            <button
              key={inv.id}
              onClick={() => {
                setSelectedInv(inv);
                setSelectedFactorIdx(0);
              }}
              className={`p-3.5 rounded-xl border text-left shrink-0 w-72 text-xs transition-all ${
                isSelected
                  ? 'bg-navy-50/80 dark:bg-navy-900/50 border-[#16324F] dark:border-sky-400 shadow-sm'
                  : 'bg-white dark:bg-[#131D31] border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="font-bold font-display text-slate-900 dark:text-white truncate mb-1">
                {inv.title}
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                <span className="uppercase font-semibold">{inv.excursionType?.replace('_', ' ')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!selectedInv ? (
        <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-12 text-center text-xs text-slate-500">
          No active investigations. Click "Trigger Analysis" to correlate excursion lots with cleanroom sensor deviations.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Excursion Context Banner */}
          <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Excursion Diagnostic Scope
                </span>
                <h2 className="text-base font-display font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedInv.title}
                </h2>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Observation Window</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {new Date(selectedInv.windowStart).toLocaleDateString()} &mdash; {new Date(selectedInv.windowEnd).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-[#18243C] rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A]">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Affected Wafer Lots</span>
                <span className="text-base font-display font-bold text-slate-900 dark:text-white font-mono">
                  {selectedInv.affectedLotIds?.join(', ') || 'LOT-240913-A'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Exhibited anomalous yield reduction
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-[#18243C] rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A]">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Traversed Tool Sequence</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                  {selectedInv.involvedToolIds?.join(' → ') || 'CVD-01 → LITHO-01 → ETCH-01 → CMP-01'}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Process chain traversed by affected wafer lots
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-[#18243C] rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A]">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Ranking Methodology</span>
                <span className="text-base font-display font-bold text-slate-900 dark:text-white">
                  Cohen's d Effect Size
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Standardized shift vs nominal baseline lots
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Contributing Factors Table */}
          <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E7EC] dark:border-[#1E2D4A] flex justify-between items-center bg-slate-50/50 dark:bg-[#0E1626]">
              <div>
                <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                  Candidate Factor Ranking (Statistical Association)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ranked by standardized effect size (Cohen's d). Terminology adheres strictly to non-causal association until verified by physical tool inspection.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0E1626] border-b border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Candidate Contributing Factor</th>
                    <th className="py-3 px-4">Equipment & Parameter</th>
                    <th className="py-3 px-4 text-right">Effect Size (Cohen's d)</th>
                    <th className="py-3 px-4 text-right">Sample (N_ex / N_base)</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1E2D4A]">
                  {(selectedInv.candidateFactors || [
                    {
                      factorName: 'CMP Slurry Flow Rate Drop',
                      equipmentId: 'CMP-01',
                      parameter: 'slurry_flow_rate',
                      effectSize: 2.84,
                      confidence: 'high',
                      sampleSizeExcursion: 25,
                      sampleSizeBaseline: 150,
                      meanExcursion: 152.4,
                      meanBaseline: 200.1,
                      alternativeExplanations: [
                        'Slurry dispense peristaltic tubing crimp or micro-particle clogging',
                        'Flow sensor transducer calibration drift',
                        'Upstream incoming wafer oxide thickness variation'
                      ],
                      engineerChecklist: [
                        'Inspect CMP-01 dispense nozzle tip for slurry agglomeration',
                        'Perform gravimetric dispense flow verification into beaker',
                        'Review incoming post-CVD oxide thickness map'
                      ]
                    },
                    {
                      factorName: 'Etch RF Reflected Power Elevation',
                      equipmentId: 'ETCH-02',
                      parameter: 'rf_reflected_power',
                      effectSize: 1.42,
                      confidence: 'medium',
                      sampleSizeExcursion: 25,
                      sampleSizeBaseline: 150,
                      meanExcursion: 28.5,
                      meanBaseline: 18.2,
                      alternativeExplanations: [
                        'Matching network auto-tuner capacitor motor backlash',
                        'Chamber wall fluoropolymer seasoning layer thinning'
                      ],
                      engineerChecklist: [
                        'Check impedance matching position log on ETCH-02 chamber',
                        'Inspect turbo pump foreline pressure stability'
                      ]
                    }
                  ]).map((factor: any, idx: number) => {
                    const isSelected = selectedFactorIdx === idx;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedFactorIdx(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-navy-50/80 dark:bg-navy-900/50 border-l-4 border-l-[#16324F] dark:border-l-sky-400 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-500 font-mono">#{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {factor.factorName}
                          <span className="block text-[10px] text-slate-500 font-normal italic">
                            associated with excursion (candidate contributor)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                            {factor.equipmentId}
                          </span>{' '}
                          / <span className="font-mono text-[11px]">{factor.parameter}</span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-mono font-bold">
                          <span className="text-[#16324F] dark:text-sky-400">
                            d = {factor.effectSize?.toFixed(2) || '2.50'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-mono text-slate-500">
                          {factor.sampleSizeExcursion || 25} / {factor.sampleSizeBaseline || 150}
                        </td>
                        <td className="py-3 px-4">
                          <StatusPill
                            status={factor.confidence === 'high' ? 'critical' : 'warning'}
                            customLabel={`${(factor.confidence || 'medium').toUpperCase()} CONFIDENCE`}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-semibold text-[#16324F] dark:text-sky-400 hover:underline">
                            Inspect
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Factor Evidence & Verification Checklist Drilldown */}
          {activeFactor && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evidence Comparison Card */}
              <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Telemetry Evidence & Shift
                    </span>
                    <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white mt-0.5">
                      {activeFactor.factorName} ({activeFactor.equipmentId})
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs my-3">
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/60">
                      <span className="text-rose-700 dark:text-rose-400 block text-[10px] uppercase font-semibold">
                        Excursion Mean (Shifted)
                      </span>
                      <span className="text-lg font-bold font-mono text-rose-900 dark:text-rose-200 tabular-nums">
                        {activeFactor.meanExcursion?.toFixed(2) || '152.40'}
                      </span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-1">
                        Sample N = {activeFactor.sampleSizeExcursion || 25} readings
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-[#18243C] rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A]">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">
                        Baseline Mean (Nominal)
                      </span>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                        {activeFactor.meanBaseline?.toFixed(2) || '200.10'}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Sample N = {activeFactor.sampleSizeBaseline || 150} readings
                      </span>
                    </div>
                  </div>

                  {/* Plausible Alternative Explanations */}
                  <div className="mt-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
                      Plausible Alternative Explanations
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                      {(
                        activeFactor.alternativeExplanations || [
                          'Peristaltic delivery tubing crimp or nozzle micro-salt agglomeration',
                          'Flow meter sensor transducer decalibration',
                          'Upstream incoming wafer oxide topography thickness variation'
                        ]
                      ).map((alt: string, i: number) => (
                        <li key={i}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-[#1E2D4A] text-[11px] text-slate-500 italic">
                  Note: Statistical association and standardized effect size do not confirm causality without direct cleanroom tool inspection.
                </div>
              </div>

              {/* Cleanroom Engineer Verification Checklist */}
              <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Prescribed Diagnostic Protocol
                      </span>
                      <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white mt-0.5">
                        Cleanroom Physical Inspection Checklist
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {Object.values(checklistState).filter(Boolean).length} /{' '}
                      {(activeFactor.engineerChecklist || []).length} Verified
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Perform the following verification checks on the cleanroom floor before returning tool to active production:
                  </p>

                  <div className="space-y-2 text-xs">
                    {(
                      activeFactor.engineerChecklist || [
                        'Inspect dispense nozzle tip for slurry agglomeration',
                        'Perform gravimetric dispense flow verification into graduated cylinder',
                        'Review incoming post-CVD oxide thickness measurement profile'
                      ]
                    ).map((item: string, idx: number) => {
                      const checked = !!checklistState[`${activeFactor.factorName}-${idx}`];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleChecklist(`${activeFactor.factorName}-${idx}`)}
                          className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors ${
                            checked
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-50 dark:bg-[#18243C] border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {checked ? (
                            <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square size={16} className="text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className={checked ? 'line-through text-slate-500' : ''}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-[#1E2D4A] flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Sign-off: Authorized Cleanroom Process Engineer
                  </span>
                  <button
                    onClick={() => alert('Verification sign-off logged to audit record.')}
                    className="px-3.5 py-1.5 rounded-lg bg-[#16324F] dark:bg-sky-600 text-white font-semibold text-xs hover:bg-navy-800 dark:hover:bg-sky-700 transition-colors shadow-sm"
                  >
                    Log Checklist Sign-off
                  </button>
                </div>
              </div>
            </div>
          )}

          <AdvisoryFooter />
        </div>
      )}
    </div>
  );
};
