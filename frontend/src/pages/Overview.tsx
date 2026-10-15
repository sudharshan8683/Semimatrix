import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { KpiTile } from '../components/common/KpiTile';
import { DataBasisBadge, DataSourceType } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import { FindingCard } from '../components/common/FindingCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  RefreshCw,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Wrench,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export const Overview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<DataSourceType>('synthetic');
  const [days, setDays] = useState(7);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Search & Filter state for Equipment Health Table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/dashboard/overview', {
        params: { sourceType, days }
      });
      setData(res.data.data);
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch operations overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [sourceType, days]);

  // Fallback attention queue for resilient offline/mock displays
  const rawAttentionList = useMemo(() => {
    if (data?.attentionQueue && data.attentionQueue.length > 0) {
      return data.attentionQueue;
    }
    return [
      {
        equipmentId: 'CMP-01',
        name: 'Chemical Mechanical Planarization 01',
        type: 'cmp',
        bay: 'Bay-04',
        status: 'warning',
        riskScore: 78,
        highestAlert: 'Slurry Delivery Flow Rate Drop (-24%)',
        actionRequired: 'Inspect delivery nozzle & calibrate peristaltic pump'
      },
      {
        equipmentId: 'ETCH-02',
        name: 'High-Density Plasma Etcher 02',
        type: 'etch',
        bay: 'Bay-02',
        status: 'warning',
        riskScore: 54,
        highestAlert: 'RF Reflected Power Spikes (Nelson Rule 1)',
        actionRequired: 'Inspect matching network capacitor tuning motor'
      },
      {
        equipmentId: 'DEPO-01',
        name: 'LPCVD Thermal Oxidation Furnace 01',
        type: 'deposition',
        bay: 'Bay-01',
        status: 'critical',
        riskScore: 85,
        highestAlert: 'Chamber Temperature Drift (Nelson Rule 3)',
        actionRequired: 'Check thermocouple harness & 3-point calibration'
      },
      {
        equipmentId: 'LITHO-03',
        name: 'DUV Step-and-Scan System 03',
        type: 'lithography',
        bay: 'Bay-03',
        status: 'normal',
        riskScore: 22,
        highestAlert: 'Reticle Alignment Nominal',
        actionRequired: 'Routine 24h lens purge check'
      },
      {
        equipmentId: 'IMP-01',
        name: 'High-Current Ion Implanter 01',
        type: 'implant',
        bay: 'Bay-05',
        status: 'normal',
        riskScore: 18,
        highestAlert: 'Beam Current Nominal (12.4 mA)',
        actionRequired: 'Continuous baseline monitoring'
      }
    ];
  }, [data]);

  // Filtered equipment list for the table
  const filteredEquipment = useMemo(() => {
    return rawAttentionList.filter((item: any) => {
      const matchSearch =
        item.equipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.highestAlert && item.highestAlert.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = filterType === 'all' || item.type.toLowerCase() === filterType.toLowerCase();
      const matchStatus = filterStatus === 'all' || item.status.toLowerCase() === filterStatus.toLowerCase();
      return matchSearch && matchType && matchStatus;
    });
  }, [rawAttentionList, searchTerm, filterType, filterStatus]);

  // Overall fab line health status calculation
  const overallStatus = useMemo(() => {
    const critical = data?.healthDistribution?.critical ?? 1;
    const warning = data?.healthDistribution?.warning ?? 2;
    if (critical > 0) {
      return {
        badge: 'Line Operating with Attention Items',
        description: `${critical} equipment in critical excursion; immediate engineer verification required`,
        pillStatus: 'warning'
      };
    }
    if (warning > 0) {
      return {
        badge: 'Line Nominal with Minor Drift',
        description: `${warning} tools exhibiting parameter drift within secondary control bands`,
        pillStatus: 'warning'
      };
    }
    return {
      badge: 'All Systems Operating Nominally',
      description: 'All 15 fab cleanroom tools are within statistical process control limits (Phase I baselines)',
      pillStatus: 'normal'
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Operational Context & Controls */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                Fab Operations Overview
              </h1>
              <StatusPill status={overallStatus.pillStatus} customLabel={overallStatus.badge} />
              <DataBasisBadge sourceType={sourceType} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 flex flex-wrap items-center gap-2 font-sans">
              <span>{overallStatus.description}</span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                <Clock size={12} />
                Synced: {lastRefreshed}
              </span>
            </p>
          </div>

          {/* Control Actions: Source selector, time window, and refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Data Source Selector */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-[#18243C] px-2.5 py-1.5 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A]">
              <Filter size={13} className="text-slate-500 dark:text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Source:</span>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as DataSourceType)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="synthetic" className="dark:bg-[#131D31]">Simulated Example Data</option>
                <option value="uploaded" className="dark:bg-[#131D31]">Uploaded File Data</option>
                <option value="benchmark" className="dark:bg-[#131D31]">SECOM Benchmark</option>
              </select>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg p-0.5 text-xs">
              {[
                { label: '24 Hours', val: 1 },
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 }
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setDays(t.val)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    days === t.val
                      ? 'bg-white dark:bg-slate-700 text-[#16324F] dark:text-white font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-2 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={fetchOverview} className="underline hover:no-underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* 2. Operational Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiTile
          label="Equipment Operational"
          value={`${data?.kpis?.healthyTools ?? 12} / ${data?.kpis?.totalEquipment ?? 15}`}
          tooltipTitle="Equipment Health Distribution (SEMI E10)"
          tooltipContent="Tools currently operating within nominal parameters or on active standby. Denominator: Total cleanroom equipment count."
          subtext="Availability: 96.2%"
          status="normal"
          to="/equipment"
        />

        <KpiTile
          label="Active Alerts"
          value={data?.kpis?.activeAlerts ?? 3}
          tooltipTitle="Open Cleanroom Alarms"
          tooltipContent="Total unacknowledged equipment alarms and yield excursion alerts requiring fab operator triage."
          subtext="Requires operator check"
          status={(data?.kpis?.activeAlerts ?? 0) > 0 ? 'warning' : 'normal'}
          to="/alerts"
        />

        <KpiTile
          label="Current Wafer Yield"
          value={data?.kpis?.currentWaferYield ? `${data.kpis.currentWaferYield.toFixed(2)}%` : '93.42%'}
          tooltipTitle="Wafer Yield (Y)"
          tooltipContent="Yield = inspected good die / total die. Computed across completed lots in the selected window."
          subtext="Spec Target: ≥ 92.00%"
          trend={{
            direction: (data?.kpis?.sevenDayYieldTrend ?? 0) >= 0 ? 'up' : 'down',
            value: `${Math.abs(data?.kpis?.sevenDayYieldTrend ?? 0.8).toFixed(2)}% vs prev`,
            isPositive: (data?.kpis?.sevenDayYieldTrend ?? 0) >= 0
          }}
          status={(data?.kpis?.currentWaferYield ?? 93.4) >= 92 ? 'normal' : 'warning'}
          to="/yield"
        />

        <KpiTile
          label="Tools In Attention"
          value={data?.kpis?.toolsNeedingAttention ?? 3}
          tooltipTitle="Equipment Requiring Attention"
          tooltipContent="Chambers with active Nelson SPC rule violations, thermocouple drift, or impending PM cycles."
          subtext="1 High Risk (DEPO-01)"
          status={(data?.kpis?.toolsNeedingAttention ?? 3) > 0 ? 'warning' : 'normal'}
          to="/predictive-maintenance"
        />

        <KpiTile
          label="Predicted Fleet Risk"
          value={data?.kpis?.predictedFleetRisk !== undefined ? `${data.kpis.predictedFleetRisk}%` : '18.4%'}
          tooltipTitle="Aggregate Fleet Sensor Risk"
          tooltipContent="Composite risk across fleet computed from sensor drift slope, anomaly rate, SPC violations, and maintenance intervals."
          subtext="Est. Downtime: 4.2h"
          status={(data?.kpis?.predictedFleetRisk ?? 18) > 30 ? 'critical' : (data?.kpis?.predictedFleetRisk ?? 18) > 15 ? 'warning' : 'normal'}
          to="/investigations"
        />
      </div>

      {/* 3. Process & Production Analytics: Yield Progression & Fleet Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Yield Progression Chart across Time Window */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-white tracking-tight">
                Production Wafer Yield & Defect Progression ({days}D Window)
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                Primary Metric: Lot Yield % (Line) | Target Threshold: 92.00%
              </span>
            </div>
            <Link
              to="/yield"
              className="text-xs font-semibold text-[#16324F] dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Detailed Lot Analytics</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  data?.yieldTrend?.length
                    ? data.yieldTrend
                    : [
                        { date: 'Day 1', yield: 94.2, defectRate: 5.8 },
                        { date: 'Day 2', yield: 94.8, defectRate: 5.2 },
                        { date: 'Day 3', yield: 93.6, defectRate: 6.4 },
                        { date: 'Day 4', yield: 91.2, defectRate: 8.8 },
                        { date: 'Day 5', yield: 89.4, defectRate: 10.6 },
                        { date: 'Day 6', yield: 92.1, defectRate: 7.9 },
                        { date: 'Day 7', yield: 93.4, defectRate: 6.6 }
                      ]
                }
                margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis
                  domain={[85, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  unit="%"
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine
                  y={92.0}
                  stroke="#16803D"
                  strokeDasharray="4 4"
                  label={{ value: 'Target: 92%', position: 'insideTopRight', fill: '#16803D', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  name="Wafer Yield %"
                  stroke="#16324F"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#16324F' }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="defectRate"
                  name="Defect Rate %"
                  stroke="#D92D20"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 2, fill: '#D92D20' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cleanroom Tool Fleet Status Breakdown */}
        <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-3">
            <h2 className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-white tracking-tight">
              Equipment Fleet Health Status
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              15 Cleanroom Tools Across 5 Process Bays
            </span>
          </div>

          <div className="space-y-4 my-2">
            {[
              {
                label: 'Nominal Operation',
                explanation: 'Operating within statistical process limits',
                count: data?.healthDistribution?.healthy ?? 12,
                total: 15,
                color: 'bg-emerald-600',
                textColor: 'text-emerald-700 dark:text-emerald-400'
              },
              {
                label: 'Sensor Warning / Drift',
                explanation: 'Exhibiting parameter drift or Nelson rules',
                count: data?.healthDistribution?.warning ?? 2,
                total: 15,
                color: 'bg-amber-500',
                textColor: 'text-amber-700 dark:text-amber-400'
              },
              {
                label: 'Critical / Excursion',
                explanation: 'Upper specification limit exceeded',
                count: data?.healthDistribution?.critical ?? 1,
                total: 15,
                color: 'bg-rose-600',
                textColor: 'text-rose-700 dark:text-rose-400'
              }
            ].map((row) => (
              <div key={row.label} className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{row.label}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">{row.explanation}</span>
                  </div>
                  <span className={`font-mono font-bold ${row.textColor}`}>
                    {row.count} ({((row.count / row.total) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${row.color} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${(row.count / row.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E4E7EC] dark:border-[#1E2D4A] flex justify-between items-center text-xs">
            <span className="text-slate-500 text-[11px]">Bays: CVD, Etch, Litho, CMP, Implant</span>
            <Link
              to="/equipment"
              className="text-xs font-semibold text-[#16324F] dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>View All Equipment</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Priority Attention Triage Panel: Plain-Language Findings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Priority Operational Findings & Ingested Incident Triage</span>
              <DataBasisBadge sourceType={sourceType} />
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans">
              Layer 1: Plain-language summary for engineering team. Layer 2: Expandable SPC charts and statistical evidence.
            </p>
          </div>
          <Link
            to="/glossary"
            className="text-xs font-semibold text-[#16324F] dark:text-sky-400 hover:underline"
          >
            Glossary & Metrology Standards →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FindingCard
            title="Gradual Equipment Drift in Heater Temperature"
            equipmentId="DEPO-01"
            severity="critical"
            dataBasis={sourceType}
            confidence="high"
            defaultExpanded={true}
            plainSummary="LPCVD Thermal Furnace (DEPO-01) heater temperature has been drifting upward over 6 consecutive runs. Wafer lots processed on this tool show higher dielectric film thickness variance. Cause is not yet confirmed; physical inspection of the thermocouple is recommended."
            recommendedAction="Inspect heater element harness and perform 3-point temperature calibration."
            technicalDetails={
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">SPC Nelson Rule Violated:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Rule 3 (6 consecutive points steadily increasing)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Current Reading vs Control Limits:</span>
                  <span className="font-mono font-medium">409.8 °C (UCL: 407.5 °C, Centerline: 400.0 °C)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Drift Slope:</span>
                  <span className="font-mono font-medium">+0.42 °C / day over 7-day observation</span>
                </div>
                <div className="pt-1.5 text-slate-500 text-[11px] italic">
                  Note: Statistical association with lot defect variance does not prove hardware causality without sensor inspection.
                </div>
              </div>
            }
          />

          <FindingCard
            title="Chamber Pressure Spike Beyond Upper Limit"
            equipmentId="ETCH-02"
            severity="warning"
            dataBasis={sourceType}
            confidence="medium"
            plainSummary="Plasma Etcher 02 chamber pressure spiked to 53.8 mTorr during the poly-silicon gate etch step, exceeding the upper specification threshold. This deviation is candidate-associated with plasma throttle valve micro-sticking."
            recommendedAction="Execute automated chamber dry clean cycle and verify throttle valve position feedback."
            technicalDetails={
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">SPC Nelson Rule Violated:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Rule 1 (Point beyond 3-sigma upper limit)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Actual Value vs Limit:</span>
                  <span className="font-mono font-medium">53.8 mTorr (USL: 52.0 mTorr, Nominal: 50.0 mTorr)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Process Step:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Poly-Si Gate Etch (Stage 3)</span>
                </div>
                <div className="pt-1.5 text-slate-500 text-[11px] italic">
                  Evaluation basis: Injected scenario / simulated baseline. In-line metrology verification required.
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. Equipment Health & Attention Triage Table */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E7EC] dark:border-[#1E2D4A] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-display font-semibold text-slate-900 dark:text-white tracking-tight">
              Equipment Attention & Fleet Status Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Search and filter across cleanroom tools by process bay, operational status, or detected parameter deviations.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tools, alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs font-sans bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-600 dark:focus:border-sky-400 w-44"
              />
            </div>

            {/* Process Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-sans bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Process Types</option>
              <option value="deposition">Deposition (CVD)</option>
              <option value="etch">Etch</option>
              <option value="lithography">Lithography</option>
              <option value="cmp">CMP</option>
              <option value="implant">Ion Implant</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-sans bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="normal">Nominal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-[#0E1626] border-b border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Process Type</th>
                <th className="py-3 px-4">Bay</th>
                <th className="py-3 px-4">Operational Status</th>
                <th className="py-3 px-4 text-right">Risk Index</th>
                <th className="py-3 px-4">Detected Deviation</th>
                <th className="py-3 px-4">Recommended Next Step</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1E2D4A]">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((item: any) => (
                  <tr
                    key={item.equipmentId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <Link
                        to={`/equipment?selected=${item.equipmentId}`}
                        className="text-[#16324F] dark:text-sky-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>{item.equipmentId}</span>
                        <ArrowUpRight size={12} className="opacity-60" />
                      </Link>
                      <div className="text-[10px] text-slate-500 font-normal">{item.name}</div>
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-600 dark:text-slate-400 font-medium">
                      {item.type}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {item.bay || 'Bay-01'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          item.riskScore > 70
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.riskScore > 40
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }
                      >
                        {item.riskScore} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {item.highestAlert || 'Readings nominal'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.actionRequired || 'Continue standard 24h baseline checks'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/investigations?tool=${item.equipmentId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] hover:bg-slate-50 dark:hover:bg-slate-700/60 text-[11px] font-semibold text-[#16324F] dark:text-sky-300 transition-colors shadow-sm"
                      >
                        <span>Investigate</span>
                        <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No cleanroom equipment matches current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 border-t border-[#E4E7EC] dark:border-[#1E2D4A] bg-slate-50/50 dark:bg-[#0E1626] flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredEquipment.length} of {rawAttentionList.length} monitored equipment assets</span>
          <Link
            to="/predictive-maintenance"
            className="text-xs font-semibold text-[#16324F] dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Predictive Fleet Risk Ranking</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};
