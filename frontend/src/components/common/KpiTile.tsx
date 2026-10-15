import React from 'react';
import { Link } from 'react-router-dom';
import { InfoTooltip } from './InfoTooltip';
import { ArrowUpRight } from 'lucide-react';

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  tooltipTitle?: string;
  tooltipContent?: string;
  subtext?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    isPositive?: boolean;
  };
  status?: 'normal' | 'warning' | 'critical' | 'neutral';
  to?: string;
  onClick?: () => void;
  className?: string;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  unit,
  tooltipTitle,
  tooltipContent,
  subtext,
  trend,
  to,
  onClick,
  className = ''
}) => {
  const content = (
    <div
      className={`group relative overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:border-neutral-400 dark:hover:border-neutral-700 transition-all duration-150 flex flex-col justify-between ${
        to || onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
        <span className="font-medium text-xs truncate text-neutral-700 dark:text-neutral-300">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {tooltipContent && (
            <InfoTooltip title={tooltipTitle || label} content={tooltipContent} iconSize={13} />
          )}
          {to && (
            <ArrowUpRight
              size={14}
              className="text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors"
            />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tabular-nums tracking-tight">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        </span>
        {unit && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans font-medium">
            {unit}
          </span>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span
              className={`flex items-center gap-0.5 font-medium ml-auto ${
                trend.isPositive
                  ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'text-rose-700 dark:text-rose-400 font-medium'
              }`}
            >
              {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'}{' '}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  return content;
};
