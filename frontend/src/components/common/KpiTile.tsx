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
  status = 'neutral',
  to,
  onClick,
  className = ''
}) => {
  const getStatusIndicator = () => {
    switch (status) {
      case 'normal':
        return 'border-t-2 border-t-emerald-600 dark:border-t-emerald-400';
      case 'warning':
        return 'border-t-2 border-t-amber-500 dark:border-t-amber-400';
      case 'critical':
        return 'border-t-2 border-t-rose-600 dark:border-t-rose-500';
      default:
        return 'border-t-2 border-t-slate-400 dark:border-t-slate-600';
    }
  };

  const content = (
    <div
      className={`group relative overflow-hidden bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between ${getStatusIndicator()} ${
        to || onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
        <span className="font-sans font-semibold uppercase tracking-wider text-xs truncate text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {tooltipContent && (
            <InfoTooltip title={tooltipTitle || label} content={tooltipContent} iconSize={13} />
          )}
          {to && (
            <ArrowUpRight
              size={14}
              className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors"
            />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
          {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
        </span>
        {unit && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
            {unit}
          </span>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#1E2D4A] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span
              className={`flex items-center gap-0.5 font-medium ml-auto ${
                trend.isPositive
                  ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-rose-700 dark:text-rose-400 font-semibold'
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
