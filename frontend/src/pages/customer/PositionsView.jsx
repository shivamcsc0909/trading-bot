import React from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

export const PositionsView = ({ data, onRefresh }) => {
  const positions = data?.open_positions || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Live Synchronized Positions</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time open orders and floating positions on your MT5 terminal.</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 p-6">
        {positions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No open positions. Bot is scanning the XAUUSD M5 chart for valid 100-block setups.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans">
                  <th className="pb-3 font-semibold">Ticket</th>
                  <th className="pb-3 font-semibold">Symbol</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Volume</th>
                  <th className="pb-3 font-semibold">Open Price</th>
                  <th className="pb-3 font-semibold">Current Price</th>
                  <th className="pb-3 font-semibold">SL</th>
                  <th className="pb-3 font-semibold">TP</th>
                  <th className="pb-3 font-semibold text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {positions.map((pos) => {
                  const isProfit = (pos.profit || 0) >= 0;
                  return (
                    <tr key={pos.position_ticket || pos.id} className="hover:bg-slate-900/40">
                      <td className="py-3 text-slate-400">#{pos.position_ticket}</td>
                      <td className="py-3 font-bold text-slate-100">{pos.symbol}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.position_type === 'BUY' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {pos.position_type}
                        </span>
                      </td>
                      <td className="py-3">{parseFloat(pos.volume).toFixed(2)}</td>
                      <td className="py-3">{parseFloat(pos.open_price).toFixed(2)}</td>
                      <td className="py-3 text-slate-200">{parseFloat(pos.current_price || pos.open_price).toFixed(2)}</td>
                      <td className="py-3 text-slate-400">{pos.stop_loss ? parseFloat(pos.stop_loss).toFixed(1) : '—'}</td>
                      <td className="py-3 text-slate-400">{pos.take_profit ? parseFloat(pos.take_profit).toFixed(1) : '—'}</td>
                      <td className={`py-3 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? `+$${parseFloat(pos.profit).toFixed(2)}` : `-$${Math.abs(parseFloat(pos.profit)).toFixed(2)}`}
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
