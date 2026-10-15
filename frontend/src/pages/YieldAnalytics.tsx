import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
  Layers,
  Filter,
  RefreshCw,
  Search,
  X,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export const YieldAnalytics: React.FC = () => {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Analytics breakdowns
  const [stageBreakdown, setStageBreakdown] = useState<any[]>([]);
  const [toolBreakdown, setToolBreakdown] = useState<any[]>([]);

  // Traceability Modal
  const [selectedLot, setSelectedLot] = useState<any | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);

  const fetchYieldData = async () => {
    setLoading(true);
    try {
      const [lotsRes, stageRes, toolRes] = await Promise.all([
        apiClient.get('/lots', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } }),
        apiClient.get('/lots/analytics/by-stage'),
        apiClient.get('/lots/analytics/by-tool')
      ]);

      setLots(lotsRes.data.data.lots || []);
      setStageBreakdown(stageRes.data.data.stageBreakdown || []);
      setToolBreakdown(toolRes.data.data.toolBreakdown || []);
    } catch (err) {
      console.error('Failed to load yield analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYieldData();
  }, [statusFilter]);

  const handleOpenTraceability = async (lotId: string) => {
    setTraceLoading(true);
    try {
      const res = await apiClient.get(`/lots/${lotId}`);
      setSelectedLot(res.data.data.lot);
    } catch (err) {
      console.error('Failed to load lot traceability:', err);
    } finally {
      setTraceLoading(false);
    }
  };

  // Filter lots by search query
  const filteredLots = lots.filter((lot) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lot.lotId?.toLowerCase().includes(q) ||
      lot.recipeId?.toLowerCase().includes(q) ||
      lot.currentStage?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                Production Wafer Yield & Stage Traceability
              </h1>
              <DataBasisBadge sourceType="synthetic" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans">
              Lot progression through cleanroom stages, step-by-step defect loss decomposition, and tool correlation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Lot ID or recipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-600 dark:focus:border-sky-400 w-48"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Lots</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="scrap">Scrapped</option>
            </select>

            <button
              onClick={fetchYieldData}
              disabled={loading}
              className="p-2 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
              title="Refresh lot data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Yield Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yield by Process Stage */}
        <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-3">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Yield Loss Decomposition by Fabrication Stage
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Mean step yield (%) across CVD, Lithography, Etch, Implant, and CMP
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  stageBreakdown.length
                    ? stageBreakdown
                    : [
                        { stage: 'Deposition', stepYield: 98.4, defectRate: 1.6 },
                        { stage: 'Litho', stepYield: 97.8, defectRate: 2.2 },
                        { stage: 'Etch', stepYield: 96.5, defectRate: 3.5 },
                        { stage: 'Implant', stepYield: 98.9, defectRate: 1.1 },
                        { stage: 'CMP', stepYield: 91.2, defectRate: 8.8 }
                      ]
                }
                margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="stage"
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
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="stepYield" name="Step Yield %" fill="#16324F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tool-to-Yield Correlation */}
        <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="pb-3 border-b border-[#E4E7EC] dark:border-[#1E2D4A] mb-3">
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Tool-to-Yield Correlation & Defect Outlier Detection
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Average wafer yield per tool across all completed runs
            </span>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  toolBreakdown.length
                    ? toolBreakdown
                    : [
                        { equipmentId: 'CVD-01', avgYield: 95.8 },
                        { equipmentId: 'CVD-02', avgYield: 96.1 },
                        { equipmentId: 'ETCH-01', avgYield: 94.9 },
                        { equipmentId: 'ETCH-02', avgYield: 93.8 },
                        { equipmentId: 'CMP-01', avgYield: 86.4 },
                        { equipmentId: 'CMP-02', avgYield: 95.2 },
                        { equipmentId: 'LITHO-01', avgYield: 97.4 },
                        { equipmentId: 'IMP-01', avgYield: 98.1 }
                      ]
                }
                margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="equipmentId"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                />
                <YAxis
                  domain={[80, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  unit="%"
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="avgYield"
                  name="Mean Yield %"
                  fill="#0284C7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lot Inventory Table */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E7EC] dark:border-[#1E2D4A] flex justify-between items-center bg-slate-50/50 dark:bg-[#0E1626]">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-white">
              Wafer Lots in Production & History ({filteredLots.length})
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Click 'Inspect Trace' on any lot to examine the stage-by-stage tool log and yield progression
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0E1626] border-b border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Lot ID</th>
                <th className="py-3 px-4">Recipe</th>
                <th className="py-3 px-4">Current / Final Stage</th>
                <th className="py-3 px-4">Last Tool</th>
                <th className="py-3 px-4 text-right">Wafers In</th>
                <th className="py-3 px-4 text-right">Good Units</th>
                <th className="py-3 px-4 text-right">Scrap</th>
                <th className="py-3 px-4 text-right">Yield %</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1E2D4A]">
              {filteredLots.map((lot) => (
                <tr
                  key={lot.lotId}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">
                    {lot.lotId}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {lot.recipeId || 'REC-7NM-STD'}
                  </td>
                  <td className="py-3 px-4 uppercase text-slate-700 dark:text-slate-300 font-medium">
                    {lot.currentStage || 'Completed'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold font-mono">
                    {lot.lastEquipmentId || 'CMP-01'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono text-slate-600 dark:text-slate-400">
                    {lot.totalUnits || 25}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {lot.goodUnits || 23}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono text-rose-700 dark:text-rose-400 font-semibold">
                    {lot.defectUnits || 2}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono font-bold">
                    <span
                      className={
                        (lot.yieldPct ?? 92) >= 92
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }
                    >
                      {lot.yieldPct !== undefined ? `${lot.yieldPct.toFixed(2)}%` : '92.00%'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusPill status={lot.status} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleOpenTraceability(lot.lotId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-semibold text-[#16324F] dark:text-sky-300 transition-colors shadow-sm"
                    >
                      <span>Inspect Trace</span>
                      <ArrowRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traceability Modal */}
      {selectedLot && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E4E7EC] dark:border-[#1E2D4A] flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                  Wafer Lot Traceability: {selectedLot.lotId}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recipe: {selectedLot.recipeId} | Final Yield: {selectedLot.yieldPct?.toFixed(2)}%
                </span>
              </div>
              <button
                onClick={() => setSelectedLot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Chronological Cleanroom Process Stages
              </div>

              <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4E7EC] dark:before:bg-[#1E2D4A]">
                {(selectedLot.stages || [
                  { stageName: 'Deposition', equipmentId: 'CVD-01', inUnits: 25, goodUnits: 25, scrapUnits: 0, yieldPct: 100 },
                  { stageName: 'Lithography', equipmentId: 'LITHO-01', inUnits: 25, goodUnits: 25, scrapUnits: 0, yieldPct: 100 },
                  { stageName: 'Etch', equipmentId: 'ETCH-01', inUnits: 25, goodUnits: 24, scrapUnits: 1, yieldPct: 96 },
                  { stageName: 'Ion Implant', equipmentId: 'IMP-01', inUnits: 24, goodUnits: 24, scrapUnits: 0, yieldPct: 100 },
                  { stageName: 'CMP', equipmentId: 'CMP-01', inUnits: 24, goodUnits: 22, scrapUnits: 2, yieldPct: 91.6 }
                ]).map((stage: any, idx: number) => {
                  const hasLoss = (stage.scrapUnits ?? 0) > 0;
                  return (
                    <div key={idx} className="relative flex items-start gap-3 pl-8">
                      <div
                        className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 bg-white dark:bg-[#131D31] ${
                          hasLoss
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950'
                            : 'border-[#16324F] dark:border-sky-400'
                        }`}
                      />
                      <div className="flex-1 bg-slate-50/80 dark:bg-[#0E1626] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            Stage {idx + 1}: {stage.stageName}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                            Tool: {stage.equipmentId}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                          <div>Wafers In: {stage.inUnits}</div>
                          <div>Good Out: {stage.goodUnits}</div>
                          <div className={hasLoss ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                            Scrap: {stage.scrapUnits} ({stage.yieldPct?.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E4E7EC] dark:border-[#1E2D4A] bg-slate-50 dark:bg-[#0E1626] flex justify-end">
              <button
                onClick={() => setSelectedLot(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-xs transition-colors"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
