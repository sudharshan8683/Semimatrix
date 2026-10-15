import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import { SpcChartWrapper } from '../components/common/SpcChartWrapper';
import {
  Cpu,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Activity,
  Sliders,
  Search
} from 'lucide-react';

export const EquipmentMonitoring: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(
    searchParams.get('selected') || null
  );
  const [toolDetail, setToolDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // SPC State
  const [spcParam, setSpcParam] = useState<string>('');
  const [spcData, setSpcData] = useState<any | null>(null);
  const [spcLoading, setSpcLoading] = useState(false);
  const [spcError, setSpcError] = useState<string | null>(null);

  // Fetch Equipment List
  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/equipment');
      const list = res.data.data.equipment || [];
      setEquipmentList(list);

      // Default select first tool or preserve query param
      const initialId = searchParams.get('selected') || list[0]?.equipmentId;
      if (initialId && !selectedToolId) {
        setSelectedToolId(initialId);
      }
    } catch (err) {
      console.error('Failed to load equipment list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Fetch Tool Detail when selected
  useEffect(() => {
    if (!selectedToolId) return;
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await apiClient.get(`/equipment/${selectedToolId}`);
        const tool = res.data.data.equipment;
        setToolDetail(tool);

        // Pick initial SPC parameter from catalogue
        if (tool.parameters && tool.parameters.length > 0) {
          const firstParam = tool.parameters[0].name;
          setSpcParam(firstParam);
        }
      } catch (err) {
        console.error('Failed to load tool detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selectedToolId]);

  // Fetch SPC Analysis when tool or parameter changes
  useEffect(() => {
    if (!selectedToolId || !spcParam) return;
    const fetchSpc = async () => {
      setSpcLoading(true);
      setSpcError(null);
      try {
        const res = await apiClient.get(`/equipment/${selectedToolId}/spc`, {
          params: { parameter: spcParam, baselineCount: 30 }
        });
        setSpcData(res.data.data.spc);
      } catch (err: any) {
        setSpcError(err.response?.data?.error?.message || 'SPC analysis failed');
        setSpcData(null);
      } finally {
        setSpcLoading(false);
      }
    };
    fetchSpc();
  }, [selectedToolId, spcParam]);

  const handleSelectTool = (id: string) => {
    setSelectedToolId(id);
    setSearchParams({ selected: id });
  };

  // Filtered equipment
  const filteredTools = equipmentList.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = t.equipmentId.toLowerCase().includes(term);
      const matchName = t.name.toLowerCase().includes(term);
      const matchBay = (t.locationBay || '').toLowerCase().includes(term);
      if (!matchId && !matchName && !matchBay) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Control Bar */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                Equipment Health & Statistical Process Control (SPC)
              </h1>
              <DataBasisBadge sourceType="synthetic" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans">
              Real-time chamber telemetry, Shewhart I-charts with Phase I baseline limits, and automated Nelson rule tripwire detection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tools or bays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-600 dark:focus:border-sky-400 w-44"
              />
            </div>

            {/* Equipment Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types (15 Tools)</option>
              <option value="deposition">CVD Deposition</option>
              <option value="etch">Plasma Etch</option>
              <option value="lithography">Lithography Track</option>
              <option value="cmp">CMP Planarization</option>
              <option value="implant">Ion Implantation</option>
            </select>

            {/* Operational Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running / Nominal</option>
              <option value="warning">Warning / Drift</option>
              <option value="error">Down / Critical</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <button
              onClick={fetchEquipment}
              disabled={loading}
              className="p-2 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
              title="Refresh equipment"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Table (Left) + Detail & SPC Pane (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Equipment Table (5 cols on wide screens) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-[#E4E7EC] dark:border-[#1E2D4A] flex justify-between items-center bg-slate-50/50 dark:bg-[#0E1626]">
            <span className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Tool Fleet Roster ({filteredTools.length})
            </span>
            <span className="text-[11px] text-slate-500">Click tool to inspect SPC</span>
          </div>

          <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 dark:bg-[#0E1626] border-b border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-500 uppercase text-[10px] font-semibold tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-3">Tool ID</th>
                  <th className="py-2.5 px-3">Bay / Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1E2D4A]">
                {filteredTools.map((tool) => {
                  const isSelected = tool.equipmentId === selectedToolId;
                  return (
                    <tr
                      key={tool.equipmentId}
                      onClick={() => handleSelectTool(tool.equipmentId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-navy-50/80 dark:bg-navy-900/50 border-l-4 border-l-[#16324F] dark:border-l-sky-400 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {tool.equipmentId}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal truncate max-w-[130px]">
                          {tool.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        <div className="uppercase text-[11px] font-medium">{tool.type}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{tool.locationBay}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusPill status={tool.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-mono font-bold">
                        <span
                          className={
                            tool.healthScore > 80
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : tool.healthScore > 60
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }
                        >
                          {tool.healthScore}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Tool Details & SPC Pane (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {detailLoading || !toolDetail ? (
            <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-12 text-center text-xs text-slate-500">
              Loading cleanroom tool telemetry catalogue...
            </div>
          ) : (
            <>
              {/* Tool Summary Card */}
              <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-display text-slate-900 dark:text-white">
                        {toolDetail.equipmentId} &mdash; {toolDetail.name}
                      </span>
                      <StatusPill status={toolDetail.status} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Process: <span className="uppercase text-slate-800 dark:text-slate-200 font-semibold">{toolDetail.type}</span> | Location: {toolDetail.locationBay} | Model: {toolDetail.model || 'OEM Semiconductor Standard'}
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Health Index</span>
                    <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                      {toolDetail.healthScore ?? 95}%
                    </span>
                  </div>
                </div>

                {/* Parameter Catalogue Table */}
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Monitored Process Parameters
                  </div>
                  <div className="overflow-x-auto border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-[#0E1626] border-b border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-500 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="py-2 px-3">Parameter</th>
                          <th className="py-2 px-2">Unit</th>
                          <th className="py-2 px-2 text-right">Nominal</th>
                          <th className="py-2 px-2 text-right">Spec Limits [LSL, USL]</th>
                          <th className="py-2 px-3 text-center">SPC Analysis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1E2D4A]">
                        {toolDetail.parameters?.map((p: any) => {
                          const isCurrent = spcParam === p.name;
                          return (
                            <tr
                              key={p.name}
                              className={`transition-colors ${
                                isCurrent
                                  ? 'bg-navy-50/70 dark:bg-navy-900/40 font-semibold'
                                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                              }`}
                            >
                              <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">
                                {p.name}
                              </td>
                              <td className="py-2 px-2 text-slate-500 font-mono text-[11px]">{p.unit}</td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {p.nominal}
                              </td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-500">
                                [{p.lsl}, {p.usl}]
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={() => setSpcParam(p.name)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                    isCurrent
                                      ? 'bg-[#16324F] dark:bg-sky-500 text-white shadow-sm'
                                      : 'border border-[#E4E7EC] dark:border-[#1E2D4A] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {isCurrent ? 'Inspecting' : 'Inspect SPC'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Statistical Process Control (SPC) Section */}
              <div className="space-y-4">
                {spcLoading ? (
                  <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-12 text-center text-xs text-slate-500">
                    Computing Phase I baseline control limits and Nelson rule flags...
                  </div>
                ) : spcError ? (
                  <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 p-4 rounded-xl text-xs">
                    {spcError}
                  </div>
                ) : spcData ? (
                  <>
                    {/* Process Capability Indices (Cp, Cpk) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Process Cp</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                          {spcData.limits.cp !== null && spcData.limits.cp !== undefined
                            ? spcData.limits.cp.toFixed(3)
                            : 'N/A (No Spec)'}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Potential: (USL - LSL) / 6σ
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Process Cpk</span>
                        <span
                          className={`text-lg font-bold font-mono tabular-nums ${
                            (spcData.limits.cpk ?? 1.5) < 1.0
                              ? 'text-rose-600 dark:text-rose-400'
                              : (spcData.limits.cpk ?? 1.5) < 1.33
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {spcData.limits.cpk !== null && spcData.limits.cpk !== undefined
                            ? spcData.limits.cpk.toFixed(3)
                            : 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Centered: Target ≥ 1.33
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nelson Violations</span>
                        <span
                          className={`text-lg font-bold font-mono tabular-nums ${
                            spcData.violationsSummary.totalViolations > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {spcData.violationsSummary.totalViolations} Points
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Rules 1–4 monitored
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Statistical State</span>
                        <span
                          className={`text-sm font-bold mt-1 block ${
                            spcData.inControl
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {spcData.inControl ? 'Nominal / In Control' : 'Out of Control (Drift)'}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Shewhart Phase II evaluation
                        </span>
                      </div>
                    </div>

                    {/* Shewhart Chart Component */}
                    <SpcChartWrapper
                      data={spcData.points}
                      limits={{
                        mean: spcData.limits.mean,
                        sigma: spcData.limits.sigma,
                        ucl: spcData.limits.ucl,
                        lcl: spcData.limits.lcl,
                        usl: spcData.limits.usl,
                        lsl: spcData.limits.lsl,
                        nominal: spcData.limits.nominal,
                        unit: spcData.unit,
                        parameterName: spcData.parameter
                      }}
                      height={340}
                    />

                    {/* Rule Violations Detail Banner */}
                    {spcData.violationsSummary.totalViolations > 0 && (
                      <div className="bg-white dark:bg-[#131D31] border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-rose-800 dark:text-rose-400">
                          <AlertTriangle size={15} />
                          <span>Detected SPC Nelson Rule Deviations</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {spcData.points
                            .filter((p: any) => p.isViolation)
                            .slice(0, 5)
                            .map((p: any) => (
                              <div
                                key={p.index}
                                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-[11px]"
                              >
                                <span className="font-semibold text-rose-900 dark:text-rose-300">
                                  {p.violatedRules?.join(', ')}
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 font-mono">
                                  Value: {p.value.toFixed(3)} {spcData.unit}
                                </span>
                                <span className="text-slate-500 text-[10px]">
                                  {new Date(p.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
