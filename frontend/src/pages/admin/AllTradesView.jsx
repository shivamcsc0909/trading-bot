import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, ScrollText, RefreshCw } from 'lucide-react';

export const AllTradesView = ({ type = 'trades' }) => {
  const [items, setItems] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    setLoading(false);
    if (type === 'logs') {
      const res = await api.getAdminLogs();
      if (res.success && res.data) {
        setItems(res.data.bot_logs || []);
        setAuditLogs(res.data.audit_logs || []);
      }
    } else {
      const res = await api.getAdminTrades();
      if (res.success && res.data?.trades) {
        setItems(res.data.trades);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            {type === 'logs' ? 'Platform Audit & Security Logs' : 'All Platform Trades & Executions'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {type === 'logs' ? 'System trace of authentication, API events, and admin operations.' : 'Global execution log across all client accounts.'}
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {type === 'trades' ? (
        <div className="glass-card rounded-2xl border border-slate-800 p-6 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-sans">
                <th className="pb-3 font-semibold">Deal #</th>
                <th className="pb-3 font-semibold">Trader</th>
                <th className="pb-3 font-semibold">Account</th>
                <th className="pb-3 font-semibold">Symbol</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Lots</th>
                <th className="pb-3 font-semibold">Open / Close</th>
                <th className="pb-3 font-semibold text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((t) => {
                const isProfit = (parseFloat(t.profit) || 0) >= 0;
                return (
                  <tr key={t.deal_ticket || t.id} className="hover:bg-slate-900/40">
                    <td className="py-3 text-slate-400">#{t.deal_ticket}</td>
                    <td className="py-3 font-sans text-slate-200">{t.customer_name || 'Customer'}</td>
                    <td className="py-3 text-slate-300">#{t.account_number}</td>
                    <td className="py-3 font-bold text-slate-100">{t.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.trade_type === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {t.trade_type}
                      </span>
                    </td>
                    <td className="py-3">{parseFloat(t.volume).toFixed(2)}</td>
                    <td className="py-3 text-slate-300">{parseFloat(t.open_price).toFixed(2)} &rarr; {parseFloat(t.close_price).toFixed(2)}</td>
                    <td className={`py-3 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? `+$${parseFloat(t.profit).toFixed(2)}` : `-$${Math.abs(parseFloat(t.profit)).toFixed(2)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bot Execution Logs */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-100">Bot Signal & Execution Events</h2>
            <div className="space-y-2 font-mono text-[11px] max-h-96 overflow-y-auto custom-scrollbar">
              {items.map((l) => (
                <div key={l.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-amber-400 font-bold">[{l.event_type}] <span className="text-slate-300 font-normal">{l.message}</span></div>
                  <div className="text-slate-500 text-[10px] mt-1 font-sans">{new Date(l.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Audit Trail */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-100">Security Audit Trail</h2>
            <div className="space-y-2 font-mono text-[11px] max-h-96 overflow-y-auto custom-scrollbar">
              {auditLogs.map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-sky-400 font-bold">{a.action} <span className="text-slate-400 text-[10px] font-sans">by {a.full_name || 'System'}</span></div>
                  <div className="text-slate-400 text-[10px] truncate">{a.details_json}</div>
                  <div className="text-slate-500 text-[10px] mt-1 font-sans">{new Date(a.created_at).toLocaleString()} • IP: {a.ip_address}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
