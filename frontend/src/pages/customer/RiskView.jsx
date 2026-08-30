import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldCheck, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';

export const RiskView = ({ data, onRefresh }) => {
  const [form, setForm] = useState({
    risk_percent: 2.0,
    max_lot_size: 1.0,
    min_lot_size: 0.01,
    max_open_positions: 2,
    max_daily_sl_hits: 3,
    max_drawdown_percent: 5.0,
    max_spread_points: 35,
    news_filter_enabled: 1,
    emergency_stop_enabled: 0
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (data?.risk_settings) {
      setForm({
        risk_percent: parseFloat(data.risk_settings.risk_percent) || 2.0,
        max_lot_size: parseFloat(data.risk_settings.max_lot_size) || 1.0,
        min_lot_size: parseFloat(data.risk_settings.min_lot_size) || 0.01,
        max_open_positions: parseInt(data.risk_settings.max_open_positions) || 2,
        max_daily_sl_hits: parseInt(data.risk_settings.max_daily_sl_hits) || 3,
        max_drawdown_percent: parseFloat(data.risk_settings.max_drawdown_percent) || 5.0,
        max_spread_points: parseInt(data.risk_settings.max_spread_points) || 35,
        news_filter_enabled: data.risk_settings.news_filter_enabled ? 1 : 0,
        emergency_stop_enabled: data.risk_settings.emergency_stop_enabled ? 1 : 0
      });
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const res = await api.updateCustomerRisk(form);
      if (res.success) {
        setMsg('Risk parameters saved successfully. MQL5 EA will adopt on next heartbeat.');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setMsg('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Risk Management Controls</h1>
        <p className="text-xs text-slate-400 mt-1">Configure capital protection barriers and dynamic position sizing rules.</p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Capital Protection Suite</h2>
            <p className="text-xs text-slate-400">Sourced from PDF Risk Guidelines (1-2% risk, 3 SL daily kill)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Risk Percentage per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5.0"
              value={form.risk_percent}
              onChange={(e) => setForm({ ...form, risk_percent: parseFloat(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">PDF Recommended: 1.0% to 2.0%</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Daily Max Stop Loss Hits</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.max_daily_sl_hits}
              onChange={(e) => setForm({ ...form, max_daily_sl_hits: parseInt(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">PDF Rule: 3 SL hits = Stop trading for the day</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Maximum Lot Size Ceiling</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="10.0"
              value={form.max_lot_size}
              onChange={(e) => setForm({ ...form, max_lot_size: parseFloat(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Maximum Open Positions</label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.max_open_positions}
              onChange={(e) => setForm({ ...form, max_open_positions: parseInt(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Maximum Drawdown Barrier (%)</label>
            <input
              type="number"
              step="0.5"
              min="1.0"
              max="20.0"
              value={form.max_drawdown_percent}
              onChange={(e) => setForm({ ...form, max_drawdown_percent: parseFloat(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Maximum Spread (Points)</label>
            <input
              type="number"
              min="10"
              max="100"
              value={form.max_spread_points}
              onChange={(e) => setForm({ ...form, max_spread_points: parseInt(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={form.news_filter_enabled === 1}
              onChange={(e) => setForm({ ...form, news_filter_enabled: e.target.checked ? 1 : 0 })}
              className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <div>
              <div className="text-xs font-bold text-slate-200">High-Impact News Filter (NFP / CPI / FOMC / Unemployment)</div>
              <div className="text-[11px] text-slate-400">Freeze trade entries 30 mins before and after high-impact market news releases.</div>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="gold-gradient hover:opacity-95 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Save size={16} />
          <span>{saving ? 'Updating Parameters...' : 'Save Risk Settings'}</span>
        </button>
      </form>
    </div>
  );
};
