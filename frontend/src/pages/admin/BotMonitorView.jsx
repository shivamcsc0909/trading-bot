import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Bot, RefreshCw, Power, Zap, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const BotMonitorView = () => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBots();
    const interval = setInterval(loadBots, 15000); // 15s gentle polling
    return () => clearInterval(interval);
  }, []);

  const loadBots = async () => {
    setLoading(false);
    const res = await api.getAdminBots();
    if (res.success && res.data?.bots) {
      setBots(res.data.bots);
    }
  };

  const handleToggleBot = async (bot) => {
    if (bot.status === 'RUNNING') {
      await api.stopBot(bot.id);
    } else {
      await api.startBot(bot.id);
    }
    loadBots();
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'ONLINE':
        return <Badge variant="success" size="xs">ONLINE</Badge>;
      case 'STALE':
        return <Badge variant="warning" size="xs">STALE PING</Badge>;
      case 'ERROR':
        return <Badge variant="danger" size="xs">ERROR</Badge>;
      default:
        return <Badge variant="default" size="xs">OFFLINE</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Live Bot Fleet Monitoring</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time status, heartbeat sync, and master kill switch across all client instances.</p>
        </div>
        <button
          onClick={loadBots}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition self-start sm:self-auto"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 p-6 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 font-semibold">Instance</th>
              <th className="pb-3 font-semibold">Trader</th>
              <th className="pb-3 font-semibold">MT5 Terminal</th>
              <th className="pb-3 font-semibold">Balance / Equity</th>
              <th className="pb-3 font-semibold">Strategy</th>
              <th className="pb-3 font-semibold">Mode</th>
              <th className="pb-3 font-semibold">Connection State</th>
              <th className="pb-3 font-semibold">Last Heartbeat</th>
              <th className="pb-3 font-semibold text-right">Master Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {bots.map((b) => (
              <tr key={b.id} className="hover:bg-slate-900/40">
                <td className="py-3 font-bold text-amber-400">Bot #{b.id}</td>
                <td className="py-3 font-sans text-slate-200">{b.customer_name}</td>
                <td className="py-3 text-slate-300">#{b.account_number} ({b.broker})</td>
                <td className="py-3 text-slate-100">
                  ${parseFloat(b.balance || 0).toFixed(2)} / <span className="text-emerald-400 font-bold">${parseFloat(b.equity || 0).toFixed(2)}</span>
                </td>
                <td className="py-3 font-sans text-slate-300">
                  <div>{b.strategy_name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">v{b.strategy_version || '1.0'}</div>
                </td>
                <td className="py-3">
                  <Badge variant={b.mode === 'LIVE' ? 'danger' : 'info'} size="xs">{b.mode}</Badge>
                </td>
                <td className="py-3 font-sans">
                  {getStateBadge(b.connection_state)}
                </td>
                <td className="py-3 text-slate-400 text-[11px] font-sans">
                  {b.last_heartbeat_at ? new Date(b.last_heartbeat_at).toLocaleTimeString() : 'Never'}
                  {b.heartbeat_seconds_ago !== undefined && (
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {b.heartbeat_seconds_ago < 60 ? `${b.heartbeat_seconds_ago}s ago` : `${Math.round(b.heartbeat_seconds_ago / 60)}m ago`}
                    </span>
                  )}
                </td>
                <td className="py-3 text-right font-sans">
                  <button
                    onClick={() => handleToggleBot(b)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      b.status === 'RUNNING'
                        ? 'bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900'
                        : 'bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                    }`}
                  >
                    {b.status === 'RUNNING' ? 'Kill Bot' : 'Start Bot'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
