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

  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isViolation) {
      return (
        <circle
          key={`dot-${payload.index}`}
          cx={cx}
          cy={cy}
          r={4.5}
          fill="#DC2626"
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
        r={2}
        fill="#71717A"
        stroke="none"
      />
    );
  };

  return (
    <div className={`w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            {parameterName} {unit ? `(${unit})` : ''} &mdash; Shewhart Control Chart
          </span>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            CL: {mean.toFixed(2)}, UCL: {ucl.toFixed(2)}, LCL: {lcl.toFixed(2)}
            {usl !== undefined && lsl !== undefined && ` | Spec: [${lsl.toFixed(2)}, ${usl.toFixed(2)}]`}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-black dark:bg-white inline-block"></span>
            <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">Measurement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
            <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">Control (UCL/LCL)</span>
          </div>
          {usl !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dotted border-amber-500 inline-block"></span>
              <span className="text-neutral-600 dark:text-neutral-400 text-[11px]">Spec (USL/LSL)</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(113, 113, 122, 0.2)" />
            <XAxis
              dataKey="index"
              tick={{ fontSize: 10, fill: '#71717A' }}
              tickFormatter={(val) => `#${val}`}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#71717A' }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as SpcDataPoint;
                  return (
                    <div className="bg-neutral-900 border border-neutral-700 p-2.5 rounded-lg shadow-xl text-xs text-white space-y-1">
                      <div className="font-semibold text-[11px] text-neutral-300">
                        Reading #{pt.index}
                      </div>
                      <div className="font-mono text-sm font-bold text-white">
                        {pt.value.toFixed(3)} {unit}
                      </div>
                      {pt.isViolation && pt.violatedRules && (
                        <div className="text-[10px] text-rose-400 font-semibold pt-1 border-t border-neutral-700">
                          Violation: {pt.violatedRules.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Spec Limits */}
            {usl !== undefined && (
              <ReferenceLine
                y={usl}
                stroke="#D97706"
                strokeDasharray="2 2"
                label={{ value: `USL ${usl.toFixed(1)}`, fill: '#D97706', fontSize: 10, position: 'right' }}
              />
            )}
            {lsl !== undefined && (
              <ReferenceLine
                y={lsl}
                stroke="#D97706"
                strokeDasharray="2 2"
                label={{ value: `LSL ${lsl.toFixed(1)}`, fill: '#D97706', fontSize: 10, position: 'right' }}
              />
            )}

            {/* Control Limits */}
            <ReferenceLine
              y={ucl}
              stroke="#DC2626"
              strokeDasharray="4 4"
              label={{ value: `UCL ${ucl.toFixed(1)}`, fill: '#DC2626', fontSize: 10, position: 'right' }}
            />
            <ReferenceLine
              y={lcl}
              stroke="#DC2626"
              strokeDasharray="4 4"
              label={{ value: `LCL ${lcl.toFixed(1)}`, fill: '#DC2626', fontSize: 10, position: 'right' }}
            />

            {/* Centerline */}
            <ReferenceLine
              y={mean}
              stroke="#16A34A"
              strokeWidth={1.5}
              label={{ value: `CL ${mean.toFixed(1)}`, fill: '#16A34A', fontSize: 10, position: 'left' }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#18181B"
              strokeWidth={1.5}
              dot={renderDot}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
