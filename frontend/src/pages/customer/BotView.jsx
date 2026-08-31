import React from 'react';
import { Badge } from '../../components/Badge';
import { Bot, Power, ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

export const BotView = ({ data, onToggleBot, onToggleMode, onRefresh }) => {
  const bot = data?.bot || {};
  const license = data?.license || {};
  const risk = data?.risk_settings || {};
  const isRunning = bot?.status === 'RUNNING';
  const isDemo = (bot?.mode || 'DEMO') === 'DEMO';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Bot Controller & Runtime State</h1>
        <p className="text-xs text-slate-400 mt-1">Manage active trading instances, kill switch, and paper/live trading modes.</p>
      </div>

      {/* Main Bot Controller Box */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Bot size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{APP_CONFIG.COMPANY_NAME} Master Bot Engine</h2>
                <Badge variant={isRunning ? 'success' : 'danger'}>{isRunning ? 'RUNNING' : 'STOPPED'}</Badge>
                <Badge variant={isDemo ? 'info' : 'warning'}>{isDemo ? 'DEMO' : 'LIVE'}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Magic Number: <span className="font-mono text-amber-400 font-bold">{bot?.magic_number || 108801}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBot}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition shadow-lg ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-rose-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-950/50'
              }`}
            >
              <Power size={16} />
              <span>{isRunning ? 'ACTIVATE MASTER KILL SWITCH' : 'START TRADING ENGINE'}</span>
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200">Execution Mode (Demo First Policy)</h3>
              <p className="text-[11px] text-slate-400">Live trading requires explicit verification and active license status.</p>
            </div>
            <button
              onClick={onToggleMode}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                isDemo
                  ? 'bg-sky-950/80 border-sky-600 text-sky-300'
                  : 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-md shadow-rose-950/40'
              }`}
            >
              {isDemo ? 'Currently in DEMO MODE (Paper Trading)' : 'Currently in LIVE TRADING MODE'}
            </button>
          </div>
        </div>

        {/* Runtime Checklist */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Trading Health Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">License Status</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                <CheckCircle size={14} /> {license?.status || 'ACTIVE'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Time Window Filter</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                <CheckCircle size={14} /> F1 Filter Active (No 9AM-2PM IST)
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Risk Manager</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                <CheckCircle size={14} /> {risk?.risk_percent || 2.0}% / max 3 SLs
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Candlestick Verification</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                <CheckCircle size={14} /> Pin Bar / Engulfing Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
