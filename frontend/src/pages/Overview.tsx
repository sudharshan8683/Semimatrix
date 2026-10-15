import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { KpiTile } from '../components/common/KpiTile';
import { DataBasisBadge, DataSourceType } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';

import {
  RefreshCw,
  ArrowRight,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  UploadCloud
} from 'lucide-react';
import { UploadDataModal } from '../components/common/UploadDataModal';

export const Overview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<DataSourceType>('synthetic');
  const [days, setDays] = useState(7);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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
        actionRequired: 'Inspect heater thermocouple & recalibrate thermal zone 2'
      },
      {
        equipmentId: 'LITHO-01',
        name: 'Deep UV Stepper Scanner 01',
        type: 'lithography',
        bay: 'Bay-03',
        status: 'normal',
        riskScore: 12,
        highestAlert: 'Wafer Stage Alignment Nominal',
        actionRequired: 'Continuous baseline monitoring'
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

  const overallStatus = useMemo(() => {
    const critical = data?.healthDistribution?.critical ?? 1;
    const warning = data?.healthDistribution?.warning ?? 2;
    if (critical > 0) {
      return {
        badge: 'Attention Required',
        description: `${critical} equipment in critical excursion`,
        pillStatus: 'warning'
      };
    }
    if (warning > 0) {
      return {
        badge: 'Minor Drift Detected',
        description: `${warning} tools exhibiting parameter drift`,
        pillStatus: 'warning'
      };
    }
    return {
      badge: 'Nominal Operation',
      description: 'All fab tools within statistical control limits',
      pillStatus: 'normal'
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Operational Context & Controls */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Operations Overview
              </h1>
              <StatusPill status={overallStatus.pillStatus} customLabel={overallStatus.badge} />
            </div>
          </div>

          {/* Control Actions: Source selector, time window, and refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Upload Dataset Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UploadCloud size={14} />
              <span>Upload Dataset</span>
            </button>

            {/* Data Source Selector */}
            <div className="flex items-center gap-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <Filter size={13} className="text-neutral-500" />
              <span className="text-neutral-500 dark:text-neutral-400 font-medium">Source:</span>
              <select
                value={sourceType}
                onChange={(e) => {
                  const val = e.target.value as DataSourceType;
                  setSourceType(val);
                  if (val === 'uploaded') {
                    setIsUploadOpen(true);
                  }
                }}
                className="bg-transparent text-neutral-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="synthetic" className="dark:bg-neutral-900">Simulated Data</option>
                <option value="uploaded" className="dark:bg-neutral-900">Uploaded File</option>
                <option value="benchmark" className="dark:bg-neutral-900">SECOM Benchmark</option>
              </select>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-0.5 text-xs">
              {[
                { label: '24h', val: 1 },
                { label: '7d', val: 7 },
                { label: '30d', val: 30 }
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setDays(t.val)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    days === t.val
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
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
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-amber-500" />
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
          tooltipTitle="Equipment Health Distribution"
          tooltipContent="Tools currently operating within nominal parameters or on active standby."
          subtext="Availability: 96.2%"
          status="normal"
          to="/equipment"
        />

        <KpiTile
          label="Active Alerts"
          value={data?.kpis?.activeAlerts ?? 3}
          tooltipTitle="Open Cleanroom Alarms"
          tooltipContent="Total unacknowledged equipment alarms requiring review."
          subtext="Requires operator check"
          status={(data?.kpis?.activeAlerts ?? 0) > 0 ? 'warning' : 'normal'}
          to="/alerts"
        />

        <KpiTile
          label="Current Wafer Yield"
          value={data?.kpis?.currentWaferYield ? `${data.kpis.currentWaferYield.toFixed(2)}%` : '93.42%'}
          tooltipTitle="Wafer Yield"
          tooltipContent="Inspected good die / total die across completed lots."
          subtext="Target: ≥ 92.00%"
          trend={{
            direction: (data?.kpis?.sevenDayYieldTrend ?? 0) >= 0 ? 'up' : 'down',
            value: `${Math.abs(data?.kpis?.sevenDayYieldTrend ?? 0.8).toFixed(2)}%`,
            isPositive: (data?.kpis?.sevenDayYieldTrend ?? 0) >= 0
          }}
          status={(data?.kpis?.currentWaferYield ?? 93.4) >= 92 ? 'normal' : 'warning'}
          to="/yield"
        />

        <KpiTile
          label="Tools In Attention"
          value={data?.kpis?.toolsNeedingAttention ?? 3}
          tooltipTitle="Equipment Requiring Attention"
          tooltipContent="Chambers with active parameter violations or maintenance needs."
          subtext="1 High Risk (DEPO-01)"
          status={(data?.kpis?.toolsNeedingAttention ?? 3) > 0 ? 'warning' : 'normal'}
          to="/predictive-maintenance"
        />

        <KpiTile
          label="Predicted Fleet Risk"
          value={data?.kpis?.predictedFleetRisk !== undefined ? `${data.kpis.predictedFleetRisk}%` : '18.4%'}
          tooltipTitle="Fleet Risk Score"
          tooltipContent="Composite risk score based on sensor drift and maintenance intervals."
          subtext="Est. Downtime: 4.2h"
          status={(data?.kpis?.predictedFleetRisk ?? 18) > 30 ? 'critical' : (data?.kpis?.predictedFleetRisk ?? 18) > 15 ? 'warning' : 'normal'}
          to="/investigations"
        />
      </div>

      {/* 3. Cleanroom Tool Fleet Health Status */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
              Equipment Fleet Health Status
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-sans">
              15 Cleanroom Tools Across 5 Process Bays (CVD, Etch, Litho, CMP, Implant)
            </span>
          </div>
          <Link
            to="/equipment"
            className="text-xs font-semibold text-neutral-900 dark:text-white hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Tools</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Nominal Operation',
              explanation: 'Operating within statistical control limits',
              count: data?.healthDistribution?.healthy ?? 12,
              total: 15,
              color: 'bg-emerald-600',
              textColor: 'text-emerald-700 dark:text-emerald-400'
            },
            {
              label: 'Sensor Warning / Drift',
              explanation: 'Exhibiting parameter drift or SPC alerts',
              count: data?.healthDistribution?.warning ?? 2,
              total: 15,
              color: 'bg-amber-500',
              textColor: 'text-amber-700 dark:text-amber-400'
            },
            {
              label: 'Critical / Excursion',
              explanation: 'Exceeded control or specification limit',
              count: data?.healthDistribution?.critical ?? 1,
              total: 15,
              color: 'bg-rose-600',
              textColor: 'text-rose-700 dark:text-rose-400'
            }
          ].map((row) => (
            <div
              key={row.label}
              className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">{row.label}</span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-400">{row.explanation}</span>
                </div>
                <span className={`font-mono font-bold text-sm ${row.textColor}`}>
                  {row.count} <span className="text-[11px] font-normal text-neutral-400">({((row.count / row.total) * 100).toFixed(0)}%)</span>
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`${row.color} h-full rounded-full transition-all duration-300`}
                  style={{ width: `${(row.count / row.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Equipment Health & Attention Triage Table */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
              Equipment Queue
            </h2>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tools, alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs font-sans bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white w-44"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs font-sans bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Process Types</option>
              <option value="deposition">Deposition (CVD)</option>
              <option value="etch">Etch</option>
              <option value="lithography">Lithography</option>
              <option value="cmp">CMP</option>
              <option value="implant">Ion Implant</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-sans bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
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
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Process Type</th>
                <th className="py-3 px-4">Bay</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Risk Index</th>
                <th className="py-3 px-4">Deviation</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((item: any) => (
                  <tr
                    key={item.equipmentId}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                      <Link
                        to={`/equipment?selected=${item.equipmentId}`}
                        className="text-neutral-900 dark:text-white hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>{item.equipmentId}</span>
                        <ArrowUpRight size={12} className="opacity-60" />
                      </Link>
                      <div className="text-[10px] text-neutral-500 font-normal">{item.name}</div>
                    </td>
                    <td className="py-3 px-4 uppercase text-neutral-600 dark:text-neutral-400 font-medium">
                      {item.type}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                      {item.bay || 'Bay-01'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      <span
                        className={
                          item.riskScore > 70
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.riskScore > 40
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }
                      >
                        {item.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                      {item.highestAlert || 'Readings nominal'}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {item.actionRequired || 'Baseline checks'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/equipment?tool=${item.equipmentId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium text-neutral-900 dark:text-white transition-colors shadow-sm"
                      >
                        <span>Inspect Tool</span>
                        <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500 text-xs">
                    No cleanroom equipment matches current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-neutral-500">
          <span>Showing {filteredEquipment.length} of {rawAttentionList.length} assets</span>
          <Link
            to="/equipment"
            className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-1"
          >
            <span>View Equipment Health</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <UploadDataModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchOverview}
      />
    </div>
  );
};
