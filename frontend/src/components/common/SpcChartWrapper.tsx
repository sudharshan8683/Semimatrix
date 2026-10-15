import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

export interface SpcDataPoint {
  index: number;
  timestamp: string;
  value: number;
  isViolation?: boolean;
  violatedRules?: string[];
}

export interface SpcLimits {
  mean: number;
  sigma: number;
  ucl: number;
  lcl: number;
  usl?: number;
  lsl?: number;
  nominal?: number;
  unit?: string;
  parameterName?: string;
}

interface SpcChartWrapperProps {
  data: SpcDataPoint[];
  limits: SpcLimits;
  height?: number;
  className?: string;
}

export const SpcChartWrapper: React.FC<SpcChartWrapperProps> = ({
  data,
  limits,
  height = 320,
  className = ''
}) => {
  const { mean, ucl, lcl, usl, lsl, unit = '', parameterName = 'Parameter' } = limits;

  // Custom Dot renderer highlighting Nelson Rule violations
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isViolation) {
      return (
        <circle
          key={`dot-${payload.index}`}
          cx={cx}
          cy={cy}
          r={5}
          fill="#D92D20"
          stroke="#ffffff"
          strokeWidth={1.5}
          className="cursor-pointer"
        />
      );
    }
    return (
      <circle
        key={`dot-${payload.index}`}
        cx={cx}
        cy={cy}
        r={2.5}
        fill="#16324F"
        stroke="none"
      />
    );
  };

  return (
    <div className={`w-full bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A]">
        <div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white font-display">
            {parameterName} {unit ? `(${unit})` : ''} &mdash; Statistical Process Control (Shewhart I-Chart)
          </span>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Phase I Baseline Limits: Centerline (CL) = {mean.toFixed(2)}, UCL = {ucl.toFixed(2)}, LCL = {lcl.toFixed(2)}
            {usl !== undefined && lsl !== undefined && ` | Spec: [${lsl.toFixed(2)}, ${usl.toFixed(2)}]`}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#16324F] dark:bg-sky-400 inline-block"></span>
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">Measurement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">Control (UCL/LCL)</span>
          </div>
          {usl !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dotted border-amber-500 inline-block"></span>
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">Specification</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
            <span className="text-rose-700 dark:text-rose-400 font-semibold text-[11px]">Nelson Rule Violation</span>
          </div>
        </div>
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fill: '#64748B' }}
              tickFormatter={(t) => {
                try {
                  const d = new Date(t);
                  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
                } catch {
                  return t;
                }
              }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#64748B' }}
              unit={unit ? ` ${unit}` : ''}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as SpcDataPoint;
                return (
                  <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg border border-slate-700 font-sans space-y-1">
                    <div className="text-[10px] text-slate-400">{new Date(pt.timestamp).toLocaleString()}</div>
                    <div className="font-bold">
                      Value: {pt.value.toFixed(3)} {unit}
                    </div>
                    {pt.isViolation && (
                      <div className="pt-1 mt-1 border-t border-slate-700 text-rose-400 font-semibold text-[10px]">
                        Violations: {pt.violatedRules?.join(', ') || 'Rule Violation'}
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Mean Centerline */}
            <ReferenceLine
              y={mean}
              stroke="#64748B"
              strokeDasharray="2 2"
              label={{ value: `CL: ${mean.toFixed(2)}`, fill: '#64748B', fontSize: 10, position: 'insideTopRight' }}
            />

            {/* Upper Control Limit (UCL = Mean + 3*sigma) */}
            <ReferenceLine
              y={ucl}
              stroke="#D92D20"
              strokeDasharray="4 4"
              label={{ value: `UCL: ${ucl.toFixed(2)}`, fill: '#D92D20', fontSize: 10, position: 'insideTopRight' }}
            />

            {/* Lower Control Limit (LCL = Mean - 3*sigma) */}
            <ReferenceLine
              y={lcl}
              stroke="#D92D20"
              strokeDasharray="4 4"
              label={{ value: `LCL: ${lcl.toFixed(2)}`, fill: '#D92D20', fontSize: 10, position: 'insideBottomRight' }}
            />

            {/* Specification Limits if present */}
            {usl !== undefined && (
              <ReferenceLine
                y={usl}
                stroke="#F5A623"
                strokeDasharray="2 2"
                label={{ value: `USL: ${usl.toFixed(2)}`, fill: '#F5A623', fontSize: 10, position: 'insideTopLeft' }}
              />
            )}
            {lsl !== undefined && (
              <ReferenceLine
                y={lsl}
                stroke="#F5A623"
                strokeDasharray="2 2"
                label={{ value: `LSL: ${lsl.toFixed(2)}`, fill: '#F5A623', fontSize: 10, position: 'insideBottomLeft' }}
              />
            )}

            <Line
              type="monotone"
              dataKey="value"
              stroke="#16324F"
              strokeWidth={1.75}
              dot={renderDot}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
