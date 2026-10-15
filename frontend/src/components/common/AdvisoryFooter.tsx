import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AdvisoryFooterProps {
  className?: string;
}

export const AdvisoryFooter: React.FC<AdvisoryFooterProps> = ({ className = '' }) => {
  return (
    <footer
      className={`mt-8 py-3 px-4 rounded border border-amber-200 bg-amber-50/70 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-300 text-xs flex items-start gap-2.5 ${className}`}
    >
      <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
      <div>
        <span className="font-bold tracking-wide uppercase text-[10px] block mb-0.5">
          Advisory System Notice — No Equipment Actuation
        </span>
        <p className="leading-relaxed text-[11px] text-amber-800 dark:text-amber-300/90 font-mono">
          Semimatrix operates strictly as an advisory, decision-support, and diagnostic platform. It does not send write commands, setpoint alterations, or recipe overrides to fab cleanroom equipment or automated material handling systems (AMHS). All maintenance scheduling, chamber interventions, and process recipe calibrations must be manually validated and executed by qualified cleanroom equipment engineers in accordance with facility standard operating procedures.
        </p>
      </div>
    </footer>
  );
};
