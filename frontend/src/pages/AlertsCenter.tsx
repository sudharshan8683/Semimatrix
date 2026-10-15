import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { DataBasisBadge } from '../components/common/DataBasisBadge';
import { StatusPill } from '../components/common/StatusPill';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Clock,
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
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
                Cleanroom Alerts & Corrective Actions
              </h1>
              <DataBasisBadge sourceType="synthetic" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-sans">
              Real-time equipment parameter excursions, Nelson rule violations, and operator acknowledgement audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search alerts or tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-navy-600 dark:focus:border-sky-400 w-48"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#18243C] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Excursions</option>
              <option value="warning">Warnings</option>
              <option value="info">Informational</option>
            </select>

            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="p-2 rounded-lg border border-[#E4E7EC] dark:border-[#1E2D4A] bg-white dark:bg-[#18243C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
              title="Refresh alerts"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* State Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E7EC] dark:border-[#1E2D4A] text-xs pb-2">
        {[
          { key: 'open', label: 'Open Alarms' },
          { key: 'acknowledged', label: 'Acknowledged' },
          { key: 'resolved', label: 'Resolved History' },
          { key: 'all', label: 'All States' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStateFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              stateFilter === tab.key
                ? 'bg-[#16324F] dark:bg-sky-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-white dark:bg-[#131D31] border border-[#E4E7EC] dark:border-[#1E2D4A] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0E1626] border-b border-[#E4E7EC] dark:border-[#1E2D4A] text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Alert Title & Root Cause Candidate</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Parameter Deviation</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Triage Audit</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#1E2D4A]">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No active cleanroom alerts matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <StatusPill status={alert.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusPill status={alert.state} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm truncate mt-0.5">
                        {alert.description || 'Sensor telemetry exceeded Phase II control limits.'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      <Link
                        to={`/equipment?selected=${alert.equipmentId}`}
                        className="text-[#16324F] dark:text-sky-400 hover:underline font-mono"
                      >
                        {alert.equipmentId || 'ALL'}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {alert.parameter ? (
                        <span className="font-mono">
                          {alert.parameter} ={' '}
                          <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                            {alert.metricValue !== undefined ? Number(alert.metricValue).toFixed(2) : 'Excursion'}
                          </strong>
                        </span>
                      ) : (
                        'Yield Outlier'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 tabular-nums text-[11px]">
                      {new Date(alert.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {alert.state === 'acknowledged' && alert.acknowledgedAt ? (
                        <span className="text-amber-700 dark:text-amber-400 font-medium">Acked: {new Date(alert.acknowledgedAt).toLocaleTimeString()}</span>
                      ) : alert.state === 'resolved' && alert.resolvedAt ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Resolved: {new Date(alert.resolvedAt).toLocaleTimeString()}</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">Pending Triage</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {alert.state === 'open' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={actingId === alert.id}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.state !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            disabled={actingId === alert.id}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 shadow-sm"
                          >
                            Resolve
                          </button>
                        )}
                        {alert.equipmentId && (
                          <Link
                            to={`/investigations?tool=${alert.equipmentId}`}
                            className="p-1 text-slate-400 hover:text-[#16324F] dark:hover:text-sky-400"
                            title="Drilldown to investigation"
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
