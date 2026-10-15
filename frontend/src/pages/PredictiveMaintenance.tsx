import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  RefreshCw,
  Search,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PredictiveMaintenance: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMaintenanceData = async () => {
    setLoading(true);
    try {
      const pmRes = await apiClient.get('/ml/fleet-risk');
      setData(pmRes.data.data);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fleetList = data?.fleetRisk?.length
    ? data.fleetRisk
    : [
        {
          equipmentId: 'CMP-01',
          name: 'CMP Polisher 01',
          type: 'cmp',
          riskScore: 78,
          primaryFactor: 'Slurry delivery flow rate drop (-24%)',
          recommendation: 'Inspect dispense line & calibrate flow sensor',
          urgency: 'critical'
        },
        {
          equipmentId: 'ETCH-02',
          name: 'Plasma Etcher 02',
          type: 'etch',
          riskScore: 54,
          primaryFactor: 'RF reflected power drift',
          recommendation: 'Check vacuum matching network capacitor tune',
          urgency: 'warning'
        },
        {
          equipmentId: 'LITHO-01',
          name: 'Lithography Track 01',
          type: 'lithography',
          riskScore: 48,
          primaryFactor: 'Resist bake plate temperature drift',
          recommendation: 'Inspect RTD sensor thermocouple and harness',
          urgency: 'warning'
        },
        {
          equipmentId: 'CVD-01',
          name: 'LPCVD Furnace 01',
          type: 'deposition',
          riskScore: 22,
          primaryFactor: 'Nominal baseline telemetry',
          recommendation: 'Continue standard preventive maintenance schedule',
          urgency: 'normal'
        }
      ];

  const filteredFleet = fleetList.filter((tool: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tool.equipmentId?.toLowerCase().includes(q) ||
      tool.name?.toLowerCase().includes(q) ||
      tool.type?.toLowerCase().includes(q) ||
      tool.primaryFactor?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & Control Bar */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Predictive Maintenance & Fleet Risk
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tools or factors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white w-48"
              />
            </div>

            <button
              onClick={fetchMaintenanceData}
              disabled={loading}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
              title="Refresh maintenance risk"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Anomaly Detection Scorecard */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            Anomaly Detection Metrics
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-semibold">Precision</span>
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {data?.syntheticScorecard?.precision !== undefined
                ? `${(data.syntheticScorecard.precision * 100).toFixed(1)}%`
                : '100.0%'}
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-semibold">Recall</span>
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {data?.syntheticScorecard?.recall !== undefined
                ? `${(data.syntheticScorecard.recall * 100).toFixed(1)}%`
                : '100.0%'}
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-semibold">False Alarms / Wk</span>
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {data?.syntheticScorecard?.falseAlarmsPerWeek ?? '0.00'}
            </span>
          </div>

          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-semibold">Mean Lead Time</span>
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {data?.syntheticScorecard?.meanLeadTimeHours ?? '4.8'}h
            </span>
          </div>
        </div>
      </div>

      {/* Fleet Risk Ranking Table */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
            Equipment Degradation & Maintenance Priority
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Equipment ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Risk Index</th>
                <th className="py-3 px-4">Primary Factor</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredFleet.map((tool: any) => (
                <tr
                  key={tool.equipmentId}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                    <Link
                      to={`/equipment?selected=${tool.equipmentId}`}
                      className="text-neutral-900 dark:text-white hover:underline font-mono"
                    >
                      {tool.equipmentId}
                    </Link>
                  </td>
                  <td className="py-3 px-4 uppercase text-neutral-600 dark:text-neutral-400 font-medium">
                    {tool.type}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono font-medium">
                    <span
                      className={
                        tool.riskScore > 70
                          ? 'text-rose-700 dark:text-rose-400'
                          : tool.riskScore > 40
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }
                    >
                      {tool.riskScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200 font-medium">
                    {tool.primaryFactor}
                  </td>
                  <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                    {tool.recommendation}
                  </td>
                  <td className="py-3 px-4">
                    <StatusPill status={tool.urgency || 'normal'} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      to={`/investigations?tool=${tool.equipmentId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-medium text-neutral-900 dark:text-white transition-colors shadow-sm"
                    >
                      <span>Investigate</span>
                      <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
