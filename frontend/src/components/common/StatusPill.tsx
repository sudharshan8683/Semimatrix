import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Wrench, Circle } from 'lucide-react';

export type SemanticStatus =
  | 'running'
  | 'idle'
  | 'warning'
  | 'critical'
  | 'maintenance'
  | 'normal'
  | 'open'
  | 'acknowledged'
  | 'resolved';

interface StatusPillProps {
  status: SemanticStatus | string;
  customLabel?: string;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  customLabel,
  className = ''
}) => {
  const normalized = (status || '').toLowerCase();

  const getConfig = () => {
    switch (normalized) {
      case 'running':
      case 'normal':
      case 'resolved':
      case 'pass':
      case 'healthy':
        return {
          label: customLabel || (normalized === 'running' ? 'Running' : normalized === 'resolved' ? 'Resolved' : 'Nominal'),
          icon: CheckCircle2,
          style: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
        };
      case 'warning':
      case 'marginal':
      case 'acknowledged':
        return {
          label: customLabel || (normalized === 'acknowledged' ? 'Acknowledged' : 'Warning'),
          icon: AlertTriangle,
          style: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
        };
      case 'critical':
      case 'down':
      case 'fault':
      case 'fail':
      case 'open':
      case 'error':
        return {
          label: customLabel || (normalized === 'open' ? 'Open Alarm' : normalized === 'down' ? 'Down / Offline' : 'Critical'),
          icon: AlertOctagon,
          style: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        };
      case 'maintenance':
      case 'calibrating':
        return {
          label: customLabel || 'Maintenance',
          icon: Wrench,
          style: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
        };
      case 'idle':
      case 'standby':
      default:
        return {
          label: customLabel || (normalized === 'idle' ? 'Idle / Standby' : status || 'Unknown'),
          icon: Circle,
          style: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${config.style} ${className}`}>
      <Icon size={12} className="shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
