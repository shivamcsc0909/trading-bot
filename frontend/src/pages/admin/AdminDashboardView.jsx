import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { Users, Bot, Key, DollarSign, Activity, ScrollText, RefreshCw, PlusCircle } from 'lucide-react';

export const AdminDashboardView = ({ onNavigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    const res = await api.getAdminDashboard();
    if (res.success && res.data) {
      setData(res.data);
    }
  };

  const stats = data?.stats || {};
  const customers = data?.recent_customers || [];
  const logs = data?.recent_logs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Administrator Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">Platform overview, customer licensing, bot monitoring, and aggregate performance.</p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Aggregate Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.total_customers || 1}
          icon={Users}
          subtitle="Registered accounts"
        />
        <StatCard
          title="Active Bot Fleets"
          value={stats.active_bots || 1}
          icon={Bot}
          highlight={true}
          subtitle={`${stats.connected_accounts || 1} MT5 terminals online`}
        />
        <StatCard
          title="Active Licenses"
          value={stats.total_licenses || 1}
          icon={Key}
          subtitle="Commercial licenses"
        />
        <StatCard
          title="Platform Closed Profit"
          value={stats.total_profit || 1850.0}
          isCurrency={true}
          icon={DollarSign}
          subtitle={`${stats.total_trades || 18} executions`}
        />
      </div>

      {/* Tables: Recent Customers & System Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users size={16} className="text-amber-400" />
              <span>Registered Customers</span>
            </h2>
            <button
              onClick={() => onNavigate('admin-customers')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              View All &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">License Key</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-sans">
                      <div className="font-bold text-slate-200">{c.full_name}</div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="py-2.5 text-amber-300 text-[11px]">{c.license_key || '—'}</td>
                    <td className="py-2.5 text-right font-sans">
                      <Badge variant={c.is_active ? 'success' : 'danger'} size="xs">
                        {c.is_active ? 'ACTIVE' : 'DISABLED'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Bot Events */}
        <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ScrollText size={16} className="text-sky-400" />
              <span>Platform Bot Logs</span>
            </h2>
            <button
              onClick={() => onNavigate('admin-logs')}
              className="text-xs text-sky-400 hover:underline font-semibold"
            >
              All Logs &rarr;
            </button>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            {logs.map((l) => (
              <div key={l.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="text-amber-400 font-bold">[{l.event_type}]</span> {l.message}
                </div>
                <span className="text-slate-500 text-[10px] shrink-0">{new Date(l.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
