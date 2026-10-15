import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  RefreshCw,
  ArrowRight,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AlertsCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<'all' | 'open' | 'acknowledged' | 'resolved'>('open');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actingId, setActingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (stateFilter !== 'all') params.state = stateFilter;
      if (severityFilter !== 'all') params.severity = severityFilter;

      const res = await apiClient.get('/alerts', { params });
      setAlerts(res.data.data.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [stateFilter, severityFilter]);

  const handleAcknowledge = async (id: string) => {
    setActingId(id);
    try {
      await apiClient.post(`/alerts/${id}/ack`);
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setActingId(null);
    }
  };

  const handleResolve = async (id: string) => {
    const notes = prompt('Enter resolution notes / corrective action taken:', 'Verified sensor calibration and cleared chamber inspection.');
    if (!notes) return;

    setActingId(id);
    try {
      await apiClient.post(`/alerts/${id}/resolve`, { notes });
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setActingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.equipmentId?.toLowerCase().includes(q) ||
      a.parameter?.toLowerCase().includes(q)
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
                Alerts & Incidents
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search alerts or tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white w-48"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Excursions</option>
              <option value="warning">Warnings</option>
              <option value="info">Informational</option>
            </select>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-sm"
              title="Refresh alerts"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* State Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 text-xs pb-2">
        {[
          { key: 'open', label: 'Open Alarms' },
          { key: 'acknowledged', label: 'Acknowledged' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'all', label: 'All States' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStateFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              stateFilter === tab.key
                ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Alert</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Deviation</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500 text-xs">
                    No active alerts matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <StatusPill status={alert.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={alert.state} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-sm truncate mt-0.5">
                        {alert.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">
                      <Link
                        to={`/equipment?selected=${alert.equipmentId}`}
                        className="text-neutral-900 dark:text-white hover:underline font-mono"
                      >
                        {alert.equipmentId || 'ALL'}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {alert.parameter ? (
                        <span className="font-mono">
                          {alert.parameter} ={' '}
                          <strong className="text-neutral-800 dark:text-neutral-200 tabular-nums">
                            {alert.metricValue !== undefined ? Number(alert.metricValue).toFixed(2) : 'Excursion'}
                          </strong>
                        </span>
                      ) : (
                        'Yield Outlier'
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 tabular-nums text-[11px]">
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-neutral-500">
                      {alert.state === 'acknowledged' && alert.acknowledgedAt ? (
                        <span className="text-amber-700 dark:text-amber-400 font-medium">Acked</span>
                      ) : alert.state === 'resolved' && alert.resolvedAt ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Resolved</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {alert.state === 'open' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={actingId === alert.id}
                            className="px-2.5 py-1 rounded bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-[11px] font-medium transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.state !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            disabled={actingId === alert.id}
                            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-medium transition-colors disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        )}
                        {alert.equipmentId && (
                          <Link
                            to={`/investigations?tool=${alert.equipmentId}`}
                            className="p-1 text-neutral-400 hover:text-black dark:hover:text-white"
                            title="Drilldown"
                          >
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
