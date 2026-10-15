import React from 'react';
import { Database, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

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
          label: 'Benchmark',
          icon: Database,
        };
      case 'uploaded':
        return {
          label: 'Uploaded',
          icon: CheckCircle2,
        };
      case 'live':
        return {
          label: 'Live',
          icon: AlertCircle,
        };
      case 'synthetic':
      default:
        return {
          label: 'Simulated',
          icon: Sparkles,
        };
    }
  };

  const meta = getMetadata();
  const Icon = meta.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 ${className}`}>
      <Icon size={12} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
      <span>{meta.label}</span>
    </div>
  );
};
