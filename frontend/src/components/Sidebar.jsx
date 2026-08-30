import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Bot,
  Zap,
  TrendingUp,
  History,
  ShieldCheck,
  User,
  ListOrdered,
  ScrollText,
  Users,
  Key,
  Layers,
  Settings,
  Activity,
  DollarSign,
  Compass
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin } = useAuth();

  const customerNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'bot', label: 'Bot Controller', icon: Bot },
    { id: 'mt5', label: 'MT5 Terminal', icon: Zap },
    { id: 'strategy', label: 'Gold Strategy & Rules', icon: Compass },
    { id: 'positions', label: 'Live Positions', icon: TrendingUp },
    { id: 'history', label: 'Trade History', icon: History },
    { id: 'risk', label: 'Risk Parameters', icon: ShieldCheck },
    { id: 'profile', label: 'Trader Profile', icon: User },
    { id: 'logs', label: 'Execution Logs', icon: ScrollText },
  ];

  const adminNav = [
    { id: 'admin-dashboard', label: 'Admin Metrics', icon: LayoutDashboard },
    { id: 'admin-customers', label: 'Customer Management', icon: Users },
    { id: 'admin-bots', label: 'Bot Monitoring', icon: Bot },
    { id: 'admin-licenses', label: 'License System', icon: Key },
    { id: 'admin-strategies', label: 'Strategy Engine', icon: Layers },
    { id: 'admin-trades', label: 'Platform Trades', icon: DollarSign },
    { id: 'admin-logs', label: 'Audit & System Logs', icon: ScrollText },
  ];

  const navItems = isAdmin ? adminNav : customerNav;

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between custom-scrollbar overflow-y-auto">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            {isAdmin ? 'ADMINISTRATION PANEL' : 'TRADER DASHBOARD'}
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick MT5 VPS Guide Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
            <Zap size={14} />
            <span>MQL5 Connector</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Attach EA to <strong>XAUUSD M5</strong> chart on Windows MT5 or VPS.
          </p>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-center">
        <div className="text-[10px] text-slate-500">Version 1.0.0 (MVP)</div>
        <div className="text-[10px] text-amber-500/70 font-mono">Demo First • 100-Block Engine</div>
      </div>
    </aside>
  );
};
