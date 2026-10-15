import React from 'react';
import { Database, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export type DataSourceType = 'synthetic' | 'uploaded' | 'benchmark' | 'live';

interface DataBasisBadgeProps {
  sourceType?: DataSourceType;
  className?: string;
}

export const DataBasisBadge: React.FC<DataBasisBadgeProps> = ({
  sourceType = 'synthetic',
  className = ''
}) => {
  const getMetadata = () => {
    switch (sourceType) {
      case 'benchmark':
        return {
          label: 'Data: Benchmark (SECOM)',
          icon: Database,
          style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
          tooltipTitle: 'SECOM Benchmark Dataset',
          tooltipContent: 'Real-world anonymized semiconductor wafer sensor readings (1,567 runs, 590 features) from UCI ML Repository. Evaluated using strictly time-ordered holdout validation (base failure rate 5.4%).'
        };
      case 'uploaded':
        return {
          label: 'Data: Uploaded File',
          icon: CheckCircle2,
          style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
          tooltipTitle: 'User Uploaded File',
          tooltipContent: 'Metrics computed strictly from user-provided CSV/XLSX file. Schema profiled and mapped to canonical parameters.'
        };
      case 'live':
        return {
          label: 'Data: Live SECS/GEM (Reserved)',
          icon: AlertCircle,
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
          tooltipTitle: 'Factory Direct Telemetry',
          tooltipContent: 'Live SECS/GEM and SEMI EDA connectivity is currently reserved in demonstration mode. No live hardware actuation permitted.'
        };
      case 'synthetic':
      default:
        return {
          label: 'Data: Simulated Example',
          icon: Sparkles,
          style: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
          tooltipTitle: 'Deterministic Synthetic Physics Loop',
          tooltipContent: 'Generated cleanroom telemetry modeling 15 tools across 5 process types with AR(1) autocorrelation noise and injected ground-truth excursions. Do not treat as factory operational telemetry.'
        };
    }
  };

  const meta = getMetadata();
  const Icon = meta.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium border ${meta.style} ${className}`}>
      <Icon size={12} className="shrink-0" />
      <span>{meta.label}</span>
      <InfoTooltip title={meta.tooltipTitle} content={meta.tooltipContent} iconSize={12} />
    </div>
  );
};
