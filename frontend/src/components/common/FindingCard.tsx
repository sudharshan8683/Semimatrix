import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DataBasisBadge, DataSourceType } from './DataBasisBadge';
import { StatusPill } from './StatusPill';

export interface FindingCardProps {
  title: string;
  plainSummary: string;
  equipmentId?: string;
  severity?: 'critical' | 'warning' | 'normal' | 'info';
  dataBasis?: DataSourceType;
  confidence?: 'low' | 'medium' | 'high';
  recommendedAction?: string;
  technicalDetails?: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  title,
  plainSummary,
  equipmentId,
  severity = 'warning',
  dataBasis = 'synthetic',
  confidence,
  recommendedAction,
  technicalDetails,
  defaultExpanded = false,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-150 overflow-hidden font-sans text-xs ${className}`}>
      {/* Summary Header */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusPill status={severity} />
            <span className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-white">
              {title}
            </span>
            {equipmentId && (
              <span className="text-neutral-700 dark:text-neutral-300 font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-xs border border-neutral-200 dark:border-neutral-800">
                {equipmentId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {confidence && (
              <span className="px-2 py-0.5 rounded text-[11px] font-sans font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 capitalize">
                {confidence} Confidence
              </span>
            )}
          </div>
        </div>

        {/* Summary text */}
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
          {plainSummary}
        </p>

        {recommendedAction && (
          <div className="mt-1 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold text-neutral-900 dark:text-neutral-200 shrink-0">
              Recommended Action:
            </span>
            <span className="text-neutral-800 dark:text-neutral-300">{recommendedAction}</span>
          </div>
        )}

        {/* Toggle Details */}
        {technicalDetails && (
          <div className="mt-1 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-end items-center text-xs">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 font-medium text-neutral-900 dark:text-neutral-100 hover:underline transition-colors"
            >
              <span>{expanded ? 'Hide Details' : 'View Details'}</span>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {technicalDetails && expanded && (
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-800 space-y-3 font-sans">
          {technicalDetails}
        </div>
      )}
    </div>
  );
};
