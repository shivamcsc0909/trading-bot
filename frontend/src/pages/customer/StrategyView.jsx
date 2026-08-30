import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Badge } from '../../components/Badge';
import { Compass, BookOpen, Filter, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export const StrategyView = () => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    setLoading(false);
    const res = await api.getStrategyDetails(1);
    if (res.success) {
      setDetails(res.data);
    }
  };

  const strategy = details?.strategy || {};
  const rules = details?.pdf_rule_matrix || {};
  const levels = rules?.key_levels || [];
  const filters = rules?.filters || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Gold Strategy & PDF Rule Matrix</h1>
        <p className="text-xs text-slate-400 mt-1">
          Exact trading rules, 100-block price action levels, and candlestick confirmations extracted from Tech Forex source PDFs.
        </p>
      </div>

      {/* Overview Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Compass size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{strategy.name || 'Tech Forex Gold 100-Block Strategy'}</h2>
              <p className="text-xs text-slate-400">{strategy.symbol || 'XAUUSD'} • {strategy.timeframe || 'M5 (5-Minute Candles)'}</p>
            </div>
          </div>
          <Badge variant="gold">PRIMARY REFERENCE PDF</Badge>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {strategy.description || 'Deterministic 100-point cycle breakout & retest level strategy with candlestick confirmation, attempt filtering, and session news rules for XAUUSD (M5). Sourced from Tech Forex Gold Strategy PDF.'}
        </p>
      </div>

      {/* PDF 100-Block Key Level Matrix */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BookOpen size={16} className="text-amber-400" />
            <span>100-Block S/R Level Execution Matrix (PDF 1 Sections 3 & 4)</span>
          </h2>
          <span className="text-xs text-slate-400">Deterministic Rules</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-semibold">100-Block Offset</th>
                <th className="pb-2 font-semibold">Setup Action & R/R Rule</th>
                <th className="pb-2 font-semibold text-right">Programmability Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {levels.map((lvl, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-bold font-mono text-amber-300">{lvl.level}</td>
                  <td className="py-2.5 text-slate-200">{lvl.action}</td>
                  <td className="py-2.5 text-right font-mono text-[11px] text-emerald-400">{lvl.class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Filters & Confirmation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Filter size={16} className="text-sky-400" />
            <span>Core Session & News Filters</span>
          </h3>
          <div className="space-y-2 text-xs">
            {filters.map((f, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-amber-400">{f.filter}</div>
                <div className="text-slate-300 mt-0.5 text-[11px]">{f.rule}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Candlestick Confirmation Rules (PDF 2 & 3)</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="font-bold text-emerald-400">Pin Bar / Hammer (Wick Ratio &ge; 2.0)</div>
              <div className="text-slate-300 mt-0.5 text-[11px]">Lower shadow must be &ge; 2x body height at support levels for Buy, or upper shadow &ge; 2x body for Sell.</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="font-bold text-emerald-400">Engulfing Candlestick Trigger</div>
              <div className="text-slate-300 mt-0.5 text-[11px]">Reversal candle body fully engulfs the preceding opposite color candle body at key block pivots.</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="font-bold text-amber-400">Filter F9: 3rd Attempt Rule</div>
              <div className="text-slate-300 mt-0.5 text-[11px]">1st touch = Best probability; 2nd = Acceptable; 3rd touch = Skip trade due to breakout hazard.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
