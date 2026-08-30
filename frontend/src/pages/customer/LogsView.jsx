import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { ScrollText, RefreshCw, Filter } from 'lucide-react';

export const LogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(false);
    const res = await api.getCustomerLogs();
    if (res.success && res.data?.logs) {
      setLogs(res.data.logs);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Live Execution & Event Logs</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time signals, risk checks, and EA heartbeat trace records.</p>
        </div>
        <button
          onClick={loadLogs}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 p-6">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No bot logs recorded yet.</div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {logs.map((log) => {
              const isError = log.log_level === 'ERROR' || log.log_level === 'CRITICAL';
              const isWarn = log.log_level === 'WARN';
              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isError
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : isWarn
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <Badge variant={isError ? 'danger' : isWarn ? 'warning' : 'default'} size="xs">
                      {log.log_level}
                    </Badge>
                    <div>
                      <span className="font-bold text-slate-200">[{log.event_type}]</span> {log.message}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 shrink-0 font-sans">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
