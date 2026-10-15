import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
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
    <div className={`bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden font-sans text-xs ${className}`}>
      {/* Layer 1: Plain-Language Summary Header */}
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusPill status={severity} />
            <span className="font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
              {title}
            </span>
            {equipmentId && (
              <span className="text-[#16324F] dark:text-cyan-300 font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700">
                {equipmentId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {confidence && (
              <span className="px-2 py-0.5 rounded-full text-[11px] uppercase font-sans font-semibold border border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
                {confidence} Confidence
              </span>
            )}
            <DataBasisBadge sourceType={dataBasis} />
          </div>
        </div>

        {/* Plain Language Sentence (Layer 1) */}
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {plainSummary}
        </p>

        {recommendedAction && (
          <div className="mt-1 pt-2.5 border-t border-slate-100 dark:border-[#1E2D4A] flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 shrink-0 text-[10px]">
              Recommended Action:
            </span>
            <span className="text-slate-800 dark:text-slate-200">{recommendedAction}</span>
          </div>
        )}

        {/* Toggle Technical Evidence */}
        {technicalDetails && (
          <div className="mt-1 pt-2 border-t border-slate-100 dark:border-[#1E2D4A] flex justify-between items-center text-[11px]">
            <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">
              Statistical correlation. Physical cleanroom verification required.
            </span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 font-semibold text-[#16324F] dark:text-sky-400 hover:underline transition-colors"
            >
              <span>{expanded ? 'Hide Technical Evidence' : 'View Technical Evidence & Charts'}</span>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        )}
      </div>

      {/* Layer 2: Expandable Technical Detail */}
      {technicalDetails && expanded && (
        <div className="p-4 bg-slate-50/80 dark:bg-[#0E1626] border-t border-[#E4E7EC] dark:border-[#1E2D4A] space-y-3 font-sans">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info size={12} className="text-[#16324F] dark:text-sky-400" />
            <span>Statistical Evidence & Engineering Detail</span>
          </div>
          {technicalDetails}
        </div>
      )}
    </div>
  );
};
