import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { Power, Activity, ShieldCheck, User, LogOut, ShieldAlert, Cpu } from 'lucide-react';

export const Navbar = ({ botData, onToggleBot, onToggleMode }) => {
  const { user, logout, isAdmin } = useAuth();

  const isRunning = botData?.status === 'RUNNING';
  const isDemo = (botData?.mode || 'DEMO') === 'DEMO';
  const isConnected = botData?.is_connected;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gold-gradient shadow-md shadow-amber-500/20">
            <Cpu className="h-6 w-6 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider gold-text">TECH FOREX</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                MT5 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">XAUUSD 100-Block Automated Engine</p>
          </div>
        </div>

        {/* Real-time Status Badges & Controls */}
        <div className="flex items-center gap-3">
          {/* MT5 Terminal Connection */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-medium text-slate-300">
              {isConnected ? 'MT5 Connected' : 'MT5 Offline'}
            </span>
          </div>

          {/* Mode Switch (DEMO / LIVE) */}
          <button
            onClick={onToggleMode}
            title="Click to toggle Demo / Live mode"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isDemo
                ? 'bg-sky-950/60 border-sky-600/40 text-sky-300 hover:bg-sky-900/60'
                : 'bg-rose-950/60 border-rose-600/50 text-rose-300 hover:bg-rose-900/60 shadow-lg shadow-rose-950/30'
            }`}
          >
            <ShieldCheck size={14} />
            <span>{isDemo ? 'DEMO MODE' : 'LIVE TRADING'}</span>
          </button>

          {/* Master Bot Kill Switch */}
          <button
            onClick={onToggleBot}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${
              isRunning
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
            }`}
          >
            <Power size={14} className={isRunning ? 'text-emerald-400' : 'text-rose-400'} />
            <span>{isRunning ? 'BOT ACTIVE' : 'BOT STOPPED'}</span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-slate-200">{user?.full_name || 'User'}</div>
              <div className="text-[10px] text-amber-400 font-semibold">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
