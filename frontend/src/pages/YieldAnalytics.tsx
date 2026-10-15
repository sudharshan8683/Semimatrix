import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../api/client';
import { StatusPill } from '../components/common/StatusPill';
import {
  RefreshCw,
  Search,
  X,
  ArrowRight,
  UploadCloud
} from 'lucide-react';
import { UploadDataModal } from '../components/common/UploadDataModal';

export const YieldAnalytics: React.FC = () => {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [selectedLot, setSelectedLot] = useState<any | null>(null);

  const fetchYieldData = async () => {
    setLoading(true);
    try {
      const lotsRes = await apiClient.get('/lots', {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined }
      });
      setLots(lotsRes.data.data.lots || []);
    } catch (err) {
      console.error('Failed to load yield analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYieldData();
  }, [statusFilter]);

  const lotStats = useMemo(() => {
    const totalLots = lots.length;
    if (!totalLots) return { totalLots: 0, avgYield: '0.00', totalIn: 0, totalGood: 0, totalScrap: 0 };
    let sumYield = 0;
    let totalIn = 0;
    let totalGood = 0;
    let totalScrap = 0;
    lots.forEach((l) => {
      sumYield += Number(l.yield ?? 0);
      totalIn += Number(l.wafersIn ?? 0);
      totalGood += Number(l.wafersGood ?? 0);
      totalScrap += Number(l.wafersScrapped ?? 0);
    });
    return {
      totalLots,
      avgYield: (sumYield / totalLots).toFixed(2),
      totalIn,
      totalGood,
      totalScrap
    };
  }, [lots]);

  const handleOpenTraceability = async (lotId: string) => {
    try {
      const res = await apiClient.get(`/lots/${lotId}`);
      setSelectedLot(res.data.data.lot);
    } catch (err) {
      console.error('Failed to load lot traceability:', err);
    }
  };

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
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Production Yield & Traceability
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
                placeholder="Search Lot ID or recipe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white w-48"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Lots</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="scrap">Scrapped</option>
            </select>

            <button
              onClick={fetchYieldData}
              disabled={loading}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
              title="Refresh lot data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Wafer Lot Metric KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Total Lots Monitored
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {lotStats.totalLots}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">Active across all stages</span>
        </div>

        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Fleet Mean Yield
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {lotStats.avgYield}%
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">Target: ≥ 92.00%</span>
        </div>

        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Good Wafers Yielded
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {lotStats.totalGood.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">of {lotStats.totalIn.toLocaleString()} in production</span>
        </div>

        <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Scrapped Wafers
          </span>
          <div className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {lotStats.totalScrap.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">Excursion & defect loss</span>
        </div>
      </div>

      {/* Lot Inventory Table */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            Wafer Lots ({filteredLots.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Lot ID</th>
                <th className="py-3 px-4">Recipe</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Last Tool</th>
                <th className="py-3 px-4 text-right">In</th>
                <th className="py-3 px-4 text-right">Good</th>
                <th className="py-3 px-4 text-right">Scrap</th>
                <th className="py-3 px-4 text-right">Yield</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredLots.map((lot) => (
                <tr
                  key={lot.lotId}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white font-mono">
                    {lot.lotId}
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                    {lot.recipeId || 'REC-STD'}
                  </td>
                  <td className="py-3 px-4 uppercase text-neutral-700 dark:text-neutral-300 font-medium">
                    {lot.currentStage || 'Completed'}
                  </td>
                  <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium font-mono">
                    {lot.lastEquipmentId || 'CMP-01'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono text-neutral-600 dark:text-neutral-400">
                    {lot.totalUnits || 25}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {lot.goodUnits || 23}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono text-rose-700 dark:text-rose-400 font-semibold">
                    {lot.defectUnits || 2}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono font-medium">
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium text-neutral-900 dark:text-white transition-colors shadow-sm"
                    >
                      <span>Trace</span>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col text-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Lot Traceability: {selectedLot.lotId}
                </h3>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Recipe: {selectedLot.recipeId} | Yield: {selectedLot.yieldPct?.toFixed(2)}%
                </span>
              </div>
              <button
                onClick={() => setSelectedLot(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Process Stages
              </div>

              <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
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
                        className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 bg-white dark:bg-neutral-950 ${
                          hasLoss
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950'
                            : 'border-black dark:border-white'
                        }`}
                      />
                      <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            Stage {idx + 1}: {stage.stageName}
                          </span>
                          <span className="font-medium text-neutral-700 dark:text-neutral-300 font-mono">
                            Tool: {stage.equipmentId}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 mt-2">
                          <div>In: {stage.inUnits}</div>
                          <div>Good: {stage.goodUnits}</div>
                          <div className={hasLoss ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                            Scrap: {stage.scrapUnits} ({stage.yieldPct?.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex justify-end">
              <button
                onClick={() => setSelectedLot(null)}
                className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black font-medium text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <UploadDataModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchYieldData}
      />
    </div>
  );
};
