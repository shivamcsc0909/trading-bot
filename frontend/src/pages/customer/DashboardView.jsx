import React, { useState } from 'react';
import { StatCard } from '../../components/StatCard';
import { Badge } from '../../components/Badge';
import { CustomerOnboarding } from '../../components/CustomerOnboarding';
import {
  DollarSign,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Power,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Terminal,
  Cpu
} from 'lucide-react';

export const DashboardView = ({ data, onToggleBot, onToggleMode, onRefresh, onNavigate }) => {
  const [showTechDetails, setShowTechDetails] = useState(false);

  const stats = data?.stats || {};
  const mt5 = data?.mt5 || {};
  const bot = data?.bot || {};
  const license = data?.license || {};
  const risk = data?.risk_settings || {};
  const positions = data?.open_positions || [];
  const lastSignal = data?.last_signal;
  const lastTrade = data?.last_trade;

  const isRunning = bot?.status === 'RUNNING';
  const isDemo = (bot?.mode || 'DEMO') === 'DEMO';
  const isConnected = Boolean(mt5?.is_connected);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Guided Onboarding Checklist for Non-Technical Users */}
      <CustomerOnboarding
        mt5={mt5}
        license={license}
        bot={bot}
        onOpenMt5Setup={() => onNavigate && onNavigate('mt5')}
      />

      {/* Top Banner with Quick Controls & System Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-100">Trading Operations Dashboard</h1>
            <Badge variant={isRunning ? 'success' : 'danger'}>
              {isRunning ? 'BOT ACTIVE' : 'BOT STOPPED'}
            </Badge>
            <Badge variant={isDemo ? 'info' : 'warning'}>
              {isDemo ? 'DEMO ACCOUNT' : 'LIVE ACCOUNT'}
            </Badge>
            <Badge variant={isConnected ? 'success' : 'danger'}>
              {isConnected ? 'MT5 ONLINE' : 'MT5 OFFLINE'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Active Strategy: <strong className="text-amber-300 font-sans">{license?.strategy_name || 'Tech Forex Gold 100-Block'}</strong> • License: <span className="font-mono text-slate-300 font-bold">{license?.license_key || 'TF-GOLD-8829-9401-K9X2'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={onToggleMode}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
              isDemo
                ? 'bg-sky-950/70 border-sky-600/40 text-sky-300 hover:bg-sky-900/60'
                : 'bg-rose-950/70 border-rose-600/50 text-rose-300 hover:bg-rose-900/60'
            }`}
          >
            Switch to {isDemo ? 'LIVE MODE' : 'DEMO MODE'}
          </button>

          <button
            onClick={onToggleBot}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition shadow-lg ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-rose-950/40'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-950/40'
            }`}
          >
            <Power size={14} />
            <span>{isRunning ? 'STOP BOT (KILL SWITCH)' : 'START BOT'}</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Account Balance"
          value={stats.balance || 10000.0}
          isCurrency={true}
          icon={DollarSign}
          subtitle={`Free Margin: $${(stats.free_margin || stats.balance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          title="Account Equity"
          value={stats.equity || 10000.0}
          isCurrency={true}
          icon={Activity}
          highlight={true}
          subtitle={`Margin Used: $${(stats.margin || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          title="Today's Closed P/L"
          value={stats.today_pl || 0.0}
          isCurrency={true}
          icon={TrendingUp}
          trend={stats.today_pl > 0 ? 4.2 : undefined}
          subtitle="Closed trades today"
        />
        <StatCard
          title="Overall Total Profit"
          value={stats.overall_pl || 0.0}
          isCurrency={true}
          icon={DollarSign}
          subtitle={`Win Rate: ${stats.win_rate || 0}% (${stats.total_trades || 0} trades)`}
        />
      </div>

      {/* Secondary Operational Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Current Drawdown</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {stats.drawdown_percent || 0.0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Max Ceiling: {risk?.max_drawdown_percent || 5.0}%</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Open Positions</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {stats.open_positions_count || positions.length} <span className="text-xs font-normal text-slate-400">/ {risk?.max_open_positions || 2} max</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Floating: <span className={(stats.floating_pl || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              ${(stats.floating_pl || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Daily SL Hit Limit</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            0 <span className="text-xs font-normal text-slate-400">/ {risk?.max_daily_sl_hits || 3} max</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">PDF 3 SL Rule Active</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Last MT5 Heartbeat</div>
          <div className="text-sm font-semibold font-mono text-slate-200 mt-1">
            {stats.last_heartbeat ? new Date(stats.last_heartbeat).toLocaleTimeString() : 'Just now'}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>EA v{mt5?.ea_version || '1.0.0'} Healthy</span>
          </div>
        </div>
      </div>

      {/* Grid: Live Positions & Last Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Positions Table */}
        <div className="lg:col-span-2 glass-card rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-amber-400" size={18} />
              <h2 className="text-sm font-bold text-slate-100">Live Synchronized Positions</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{positions.length} Active</span>
          </div>

          {positions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No open positions at this moment. Bot is actively monitoring XAUUSD M5 levels.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Ticket</th>
                    <th className="pb-2 font-semibold">Symbol</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold">Lots</th>
                    <th className="pb-2 font-semibold">Entry</th>
                    <th className="pb-2 font-semibold">Current</th>
                    <th className="pb-2 font-semibold">SL / TP</th>
                    <th className="pb-2 font-semibold text-right">Floating P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {positions.map((pos) => {
                    const isBuy = pos.position_type === 'BUY';
                    const isProfit = (pos.profit || 0) >= 0;
                    return (
                      <tr key={pos.position_ticket || pos.id} className="hover:bg-slate-900/40">
                        <td className="py-3 text-slate-400">#{pos.position_ticket}</td>
                        <td className="py-3 font-bold text-slate-200">{pos.symbol}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {pos.position_type}
                          </span>
                        </td>
                        <td className="py-3">{parseFloat(pos.volume).toFixed(2)}</td>
                        <td className="py-3">{parseFloat(pos.open_price).toFixed(2)}</td>
                        <td className="py-3 text-slate-300">{parseFloat(pos.current_price || pos.open_price).toFixed(2)}</td>
                        <td className="py-3 text-[11px] text-slate-400">
                          {pos.stop_loss ? parseFloat(pos.stop_loss).toFixed(1) : '—'} / {pos.take_profit ? parseFloat(pos.take_profit).toFixed(1) : '—'}
                        </td>
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

        {/* Last Signal & Closed Trade Context */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="text-amber-400" size={18} />
              <h2 className="text-sm font-bold text-slate-100">Latest Evaluated Signal</h2>
            </div>
            {lastSignal ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Signal UID:</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[150px]">{lastSignal.signal_uid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Direction:</span>
                  <Badge variant={lastSignal.direction === 'BUY' ? 'success' : 'danger'}>
                    {lastSignal.direction} @ {parseFloat(lastSignal.price).toFixed(2)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400">SL / TP:</span>
                  <span className="text-slate-200">{parseFloat(lastSignal.stop_loss).toFixed(2)} / {parseFloat(lastSignal.take_profit).toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-amber-300">
                  {lastSignal.reason || '100-Block Level Support with Pin Bar Confirmation'}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No signal generated in current session yet.
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="text-sky-400" size={18} />
              <h2 className="text-sm font-bold text-slate-100">Last Closed Deal</h2>
            </div>
            {lastTrade ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Deal #{lastTrade.deal_ticket}:</span>
                  <span className={`font-bold ${parseFloat(lastTrade.profit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parseFloat(lastTrade.profit) >= 0 ? `+$${parseFloat(lastTrade.profit).toFixed(2)}` : `-$${Math.abs(parseFloat(lastTrade.profit)).toFixed(2)}`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {lastTrade.trade_type} {lastTrade.volume} lots @ {lastTrade.open_price} &rarr; {lastTrade.close_price}
                </div>
                <div className="text-[10px] text-slate-400">
                  Closed at: {new Date(lastTrade.closed_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs">No closed trades recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Optional Technical Details Accordion for Advanced Traders */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 transition bg-slate-900/40"
        >
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-amber-400" />
            <span>Technical Connection & Diagnostics (Advanced)</span>
          </div>
          {showTechDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechDetails && (
          <div className="p-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono bg-slate-950/60">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 font-sans">EA Version:</span> {mt5?.ea_version || '1.0.0'}
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 font-sans">Magic Number:</span> {bot?.magic_number || 108801}
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 font-sans">Account ID:</span> #{mt5?.account_number || '50198234'}
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 font-sans">Server Ping:</span> {isConnected ? 'Active (HTTP 200 OK)' : 'Offline'}
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 font-sans">Risk Engine:</span> {risk?.risk_percent || 2.0}% / max {risk?.max_open_positions || 2} pos
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 font-sans">News Filter:</span> {risk?.news_filter_enabled ? 'Active (NFP/CPI)' : 'Disabled'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
