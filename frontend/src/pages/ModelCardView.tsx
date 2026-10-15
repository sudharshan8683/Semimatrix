import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import {
  FileCode,
  ShieldAlert,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Scale,
  BrainCircuit,
  Info
} from 'lucide-react';

export const ModelCardView: React.FC = () => {
  const [modelCard, setModelCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchModelCard = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ml/model-card');
      setModelCard(res.data.data);
    } catch (err) {
      console.error('Failed to load model card:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelCard();
  }, []);

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Title & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-700">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Model & Data Provenance Card (docs/MODEL_CARD.md)
            </h1>
            <DataBasisBadge sourceType="benchmark" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans">
            Complete transparency on SECOM benchmark training data, severe class imbalance (5.4% positive), holdout PR-AUC, and documented physical failure modes.
          </p>
        </div>

        <button
          onClick={fetchModelCard}
          disabled={loading}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Refresh model card"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Model Metadata Card */}
        <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-navy-700/80">
            <BrainCircuit size={16} className="text-navy-700 dark:text-amber-400" />
            <h2 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
              Architecture & Algorithm
            </h2>
          </div>

          <div>
            <div className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              {modelCard?.model_name || 'Semimatrix SECOM Process Classifier v1.0'}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              {modelCard?.algorithm || 'Random Forest Classifier with Median Imputation & Standard Scaling'}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-navy-700/80 space-y-2.5">
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">DATASET PROVENANCE</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold font-mono text-[11px]">
                {modelCard?.data_provenance || 'UCI SECOM Benchmark (1,567 runs × 590 sensors)'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">VALIDATION SPLIT METHOD</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                {modelCard?.split || 'Strict Chronological 80/20 Time-Split (No random shuffle leakage)'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">CLASS DISTRIBUTION</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                {modelCard?.class_balance || '1,463 Passes (93.4%) vs 104 Fails (6.6%) total; 17/314 in holdout'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-navy-700/80">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">DECISION CUTOFF RULE</span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Cutoff probability threshold calibrated to <strong>0.20</strong> instead of naive 0.50 to detect positive excursions despite severe cleanroom class scarcity.
            </p>
          </div>
        </div>

        {/* Center & Right Column: Performance & Known Failure Modes (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Holdout Metrics Section */}
          <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">
              Chronological Holdout Performance Verification
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PR-AUC</span>
                <span className="text-xl font-bold font-display text-slate-900 dark:text-slate-100 tabular-nums">
                  {modelCard?.performance_metrics?.pr_auc ?? 0.0719}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  Base rate: 0.0541
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">PRECISION (@ 0.20)</span>
                <span className="text-xl font-bold font-display text-slate-900 dark:text-slate-100 tabular-nums">
                  {modelCard?.performance_metrics?.precision !== undefined
                    ? `${(modelCard.performance_metrics.precision * 100).toFixed(1)}%`
                    : '11.8%'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  2 TP / (2 TP + 15 FP)
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">RECALL (@ 0.20)</span>
                <span className="text-xl font-bold font-display text-slate-900 dark:text-slate-100 tabular-nums">
                  {modelCard?.performance_metrics?.recall !== undefined
                    ? `${(modelCard.performance_metrics.recall * 100).toFixed(1)}%`
                    : '11.8%'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  2 of 17 true holdout fails
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-navy-800/50 rounded-lg border border-slate-200/80 dark:border-navy-700/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">FALSE ALARM RATE</span>
                <span className="text-xl font-bold font-display text-slate-900 dark:text-slate-100 tabular-nums">
                  5.05%
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  15 FP out of 297 passes
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-navy-800/50 border border-slate-200/80 dark:border-navy-700/60 rounded-lg">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Engineering Commentary on Reported Metrics
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {modelCard?.honest_commentary ||
                  'Raw accuracy (94.6%) is deliberately not used as the primary metric because a trivial majority-class predictor achieves 94.6% accuracy while detecting zero excursions. The modest PR-AUC of 0.0719 reflects the genuine difficulty of rare-event semiconductor yield forecasting from anonymized sensor features without physical chamber context.'}
              </p>
            </div>
          </div>

          {/* Documented Known Failure Modes */}
          <div className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-500" />
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
                Documented Failure Modes & Boundary Limitations
              </h3>
            </div>

            <div className="space-y-2 text-[11px]">
              {(modelCard?.known_failure_modes || [
                'High false-alarm rate if threshold is set aggressively below 0.15.',
                'Near-zero sensitivity if threshold is left at naive 0.50 default due to 5.4% positive class rarity.',
                'Cannot detect new failure modalities not represented in historical sensor channels.',
                'Sensitive to uncalibrated sensor drift across preventive maintenance boundaries.'
              ]).map((mode: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                >
                  <span className="font-bold mr-1.5">Failure Mode {idx + 1}:</span>
                  {mode}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
