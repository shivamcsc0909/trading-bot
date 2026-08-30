import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { History, RefreshCw, TrendingUp } from 'lucide-react';

export const HistoryView = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(false);
    const res = await api.getCustomerHistory();
    if (res.success && res.data?.trades) {
      setTrades(res.data.trades);
    }
  };

  const totalProfit = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);
  const winCount = trades.filter((t) => (parseFloat(t.profit) || 0) > 0).length;
  const winRate = trades.length > 0 ? ((winCount / trades.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Historical Closed Deals</h1>
          <p className="text-xs text-slate-400 mt-1">Audit log of all trades executed and closed by the MT5 Expert Advisor.</p>
        </div>
        <button
          onClick={loadHistory}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Closed Deals</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{trades.length}</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Win Rate</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{winRate}%</div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Total Net Profit</div>
          <div className={`text-xl font-bold font-mono mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalProfit >= 0 ? `+$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 p-6">
        {trades.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No historical trades found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans">
                  <th className="pb-3 font-semibold">Deal</th>
                  <th className="pb-3 font-semibold">Symbol</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Lots</th>
                  <th className="pb-3 font-semibold">Open Price</th>
                  <th className="pb-3 font-semibold">Close Price</th>
                  <th className="pb-3 font-semibold">Profit ($)</th>
                  <th className="pb-3 font-semibold text-right">Closed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trades.map((t) => {
                  const isProfit = (parseFloat(t.profit) || 0) >= 0;
                  return (
                    <tr key={t.deal_ticket || t.id} className="hover:bg-slate-900/40">
                      <td className="py-3 text-slate-400">#{t.deal_ticket}</td>
                      <td className="py-3 font-bold text-slate-100">{t.symbol}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.trade_type === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {t.trade_type}
                        </span>
                      </td>
                      <td className="py-3">{parseFloat(t.volume).toFixed(2)}</td>
                      <td className="py-3">{parseFloat(t.open_price).toFixed(2)}</td>
                      <td className="py-3 text-slate-200">{parseFloat(t.close_price).toFixed(2)}</td>
                      <td className={`py-3 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? `+$${parseFloat(t.profit).toFixed(2)}` : `-$${Math.abs(parseFloat(t.profit)).toFixed(2)}`}
                      </td>
                      <td className="py-3 text-right text-slate-400 text-[11px] font-sans">
                        {new Date(t.closed_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
