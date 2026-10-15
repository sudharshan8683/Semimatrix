import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import { SpcChartWrapper } from '../components/common/SpcChartWrapper';
import {
  RefreshCw,
  AlertTriangle,
  Search,
  UploadCloud
} from 'lucide-react';
import { UploadDataModal } from '../components/common/UploadDataModal';

export const EquipmentMonitoring: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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
        setSpcError(err.response?.data?.error?.message || 'Failed to compute SPC control limits');
      } finally {
        setSpcLoading(false);
      }
    };
    fetchSpc();
  }, [selectedToolId, spcParam]);

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
  };

  const filteredTools = equipmentList.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = t.equipmentId.toLowerCase().includes(term);
      const matchName = t.name.toLowerCase().includes(term);
      const matchBay = (t.locationBay || '').toLowerCase().includes(term);
      if (!matchId && !matchName && !matchBay) return false;
    }
    return true;
  });

  // Safely normalize SPC data structure from backend
  const spcNormalized = useMemo(() => {
    if (!spcData) return null;
    const limits = spcData.limits || {};
    const baseline = spcData.baseline || {};
    const specLimits = spcData.specLimits || {};

    const cp = specLimits.cp ?? limits.cp ?? null;
    const cpk = specLimits.cpk ?? limits.cpk ?? null;
    const violationsTotal = Array.isArray(spcData.violationsSummary)
      ? spcData.violationsSummary.length
      : (spcData.violationsSummary?.totalViolations ?? spcData.outOfControlCount ?? 0);
    const inControl = spcData.inControl ?? (spcData.outOfControlCount === 0);

    const points = (spcData.points || []).map((p: any, idx: number) => ({
      index: p.index ?? idx,
      timestamp: p.timestamp,
      value: typeof p.value === 'number' ? p.value : 0,
      isViolation: Boolean(p.isViolation ?? p.isOutOfControl ?? (p.violations && p.violations.length > 0)),
      violatedRules: p.violatedRules ?? p.violations ?? []
    }));

    const chartLimits = {
      mean: baseline.mean ?? limits.mean ?? 0,
      sigma: baseline.sigma ?? limits.sigma ?? 0,
      ucl: baseline.ucl ?? limits.ucl ?? 0,
      lcl: baseline.lcl ?? limits.lcl ?? 0,
      usl: specLimits.usl ?? limits.usl,
      lsl: specLimits.lsl ?? limits.lsl,
      nominal: baseline.cl ?? limits.cl ?? limits.nominal,
      unit: spcData.unit || '',
      parameterName: spcData.parameterName || spcData.parameter || spcParam
    };

    return {
      cp,
      cpk,
      violationsTotal,
      inControl,
      points,
      limits: chartLimits,
      unit: spcData.unit || ''
    };
  }, [spcData, spcParam]);

  return (
    <div className="space-y-6">
      {/* Title & Control Bar */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Equipment Health & SPC
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UploadCloud size={14} />
              <span>Upload Dataset</span>
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tools or bays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white w-44"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="deposition">CVD Deposition</option>
              <option value="etch">Plasma Etch</option>
              <option value="lithography">Lithography Track</option>
              <option value="cmp">CMP Planarization</option>
              <option value="implant">Ion Implantation</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
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
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
              title="Refresh equipment"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Table (Left) + Detail & SPC Pane (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Equipment Table */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
            <span className="font-semibold text-xs text-neutral-900 dark:text-white uppercase tracking-wider">
              Tool Fleet ({filteredTools.length})
            </span>
          </div>

          <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase text-[10px] font-semibold tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-3">Tool ID</th>
                  <th className="py-2.5 px-3">Bay / Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredTools.map((tool) => {
                  const isSelected = tool.equipmentId === selectedToolId;
                  return (
                    <tr
                      key={tool.equipmentId}
                      onClick={() => handleSelectTool(tool.equipmentId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-900 border-l-4 border-l-black dark:border-l-white font-semibold'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/40'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-neutral-900 dark:text-white font-mono">
                          {tool.equipmentId}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-normal truncate max-w-[130px]">
                          {tool.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                        <div className="uppercase text-[11px] font-medium">{tool.type}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{tool.locationBay}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusPill status={tool.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-mono font-medium">
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

        {/* Selected Tool Details & SPC Pane */}
        <div className="lg:col-span-7 space-y-6">
          {detailLoading || !toolDetail ? (
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-500">
              Loading equipment details...
            </div>
          ) : (
            <>
              {/* Tool Summary Card */}
              <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-neutral-900 dark:text-white">
                        {toolDetail.equipmentId} &mdash; {toolDetail.name}
                      </span>
                      <StatusPill status={toolDetail.status} />
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Process: <span className="uppercase text-neutral-800 dark:text-neutral-200 font-medium">{toolDetail.type}</span> | Location: {toolDetail.locationBay}
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-neutral-400 text-[10px] uppercase font-semibold block">Health Index</span>
                    <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                      {toolDetail.healthScore ?? 95}%
                    </span>
                  </div>
                </div>

                {/* Parameter Catalogue Table */}
                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Monitored Parameters
                  </div>
                  <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="py-2 px-3">Parameter</th>
                          <th className="py-2 px-2">Unit</th>
                          <th className="py-2 px-2 text-right">Nominal</th>
                          <th className="py-2 px-2 text-right">Spec Limits</th>
                          <th className="py-2 px-3 text-center">SPC Analysis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {toolDetail.parameters?.map((p: any) => {
                          const isCurrent = spcParam === p.name;
                          return (
                            <tr
                              key={p.name}
                              className={`transition-colors ${
                                isCurrent
                                  ? 'bg-neutral-100 dark:bg-neutral-900 font-medium'
                                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/40'
                              }`}
                            >
                              <td className="py-2 px-3 text-neutral-900 dark:text-white font-medium">
                                {p.name}
                              </td>
                              <td className="py-2 px-2 text-neutral-500 font-mono text-[11px]">{p.unit}</td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                                {p.nominal}
                              </td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-neutral-500">
                                [{p.lsl}, {p.usl}]
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  onClick={() => setSpcParam(p.name)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                    isCurrent
                                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
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
                  <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-500">
                    Computing SPC control limits...
                  </div>
                ) : spcError ? (
                  <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-200 p-4 rounded-xl text-xs">
                    {spcError}
                  </div>
                ) : spcNormalized ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Process Cp</span>
                        <span className="text-lg font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                          {spcNormalized.cp !== null && spcNormalized.cp !== undefined
                            ? spcNormalized.cp.toFixed(3)
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Process Cpk</span>
                        <span
                          className={`text-lg font-bold font-mono tabular-nums ${
                            (spcNormalized.cpk ?? 1.5) < 1.0
                              ? 'text-rose-600 dark:text-rose-400'
                              : (spcNormalized.cpk ?? 1.5) < 1.33
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {spcNormalized.cpk !== null && spcNormalized.cpk !== undefined
                            ? spcNormalized.cpk.toFixed(3)
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Rule Violations</span>
                        <span
                          className={`text-lg font-bold font-mono tabular-nums ${
                            spcNormalized.violationsTotal > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {spcNormalized.violationsTotal}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-sm text-xs">
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">State</span>
                        <span
                          className={`text-sm font-semibold mt-1 block ${
                            spcNormalized.inControl
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {spcNormalized.inControl ? 'In Control' : 'Out of Control'}
                        </span>
                      </div>
                    </div>

                    <SpcChartWrapper
                      data={spcNormalized.points}
                      limits={spcNormalized.limits}
                      height={340}
                    />

                    {spcNormalized.violationsTotal > 0 && (
                      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
                          <AlertTriangle size={15} />
                          <span>Detected SPC Rule Deviations</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {spcNormalized.points
                            .filter((p: any) => p.isViolation)
                            .slice(0, 5)
                            .map((p: any) => (
                              <div
                                key={p.index}
                                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 text-[11px]"
                              >
                                <span className="font-medium text-neutral-900 dark:text-neutral-200">
                                  {p.violatedRules?.join(', ')}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-400 font-mono">
                                  {p.value.toFixed(3)} {spcNormalized.unit}
                                </span>
                                <span className="text-neutral-500 text-[10px]">
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

      <UploadDataModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchEquipment}
      />
    </div>
  );
};
