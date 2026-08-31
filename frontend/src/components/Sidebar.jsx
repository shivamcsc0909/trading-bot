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
  ScrollText,
  Users,
  Key,
  Layers,
  HelpCircle,
  X,
  Compass
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, onCloseMobile }) => {
  const { user, isAdmin } = useAuth();

  const customerNav = [
    { id: 'dashboard', label: 'Trading Overview', icon: LayoutDashboard },
    { id: 'bot', label: 'Bot Controller', icon: Bot },
    { id: 'mt5', label: 'MT5 Terminal Setup', icon: Zap },
    { id: 'strategy', label: 'Gold Strategy & PDF Rules', icon: Compass },
    { id: 'positions', label: 'Live Positions', icon: TrendingUp },
    { id: 'history', label: 'Trade History', icon: History },
    { id: 'risk', label: 'Risk Parameters', icon: ShieldCheck },
    { id: 'help', label: 'Customer Guide & FAQ', icon: HelpCircle },
    { id: 'profile', label: 'Trader Profile', icon: User },
    { id: 'logs', label: 'Execution Logs', icon: ScrollText },
  ];

  const adminNav = [
    { id: 'admin-dashboard', label: 'Admin Metrics', icon: LayoutDashboard },
    { id: 'admin-customers', label: 'Customer Management', icon: Users },
    { id: 'admin-bots', label: 'Bot Fleet Monitoring', icon: Bot },
    { id: 'admin-strategies', label: 'Strategy Engine', icon: Layers },
    { id: 'admin-licenses', label: 'License System', icon: Key },
    { id: 'admin-trades', label: 'Platform Trades', icon: TrendingUp },
    { id: 'admin-logs', label: 'Audit & System Logs', icon: ScrollText },
  ];

  const navItems = isAdmin ? adminNav : customerNav;

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full p-4 space-y-6">
      <div className="space-y-4">
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-800">
          <div className="text-xs font-black gold-text">TECH FOREX BOT</div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

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
                  onClick={() => handleNavClick(item.id)}
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

        {/* Quick Quickstart Box for non-technical users */}
        {!isAdmin && (
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
              <Zap size={14} />
              <span>MQL5 Connector</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Attach EA to <strong>XAUUSD M5</strong> chart on Windows MT5 or VPS.
            </p>
          </div>
        )}
      </div>

      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-center">
        <div className="text-[10px] text-slate-500">Version 1.0.0 (MVP)</div>
        <div className="text-[10px] text-amber-500/70 font-mono">Demo First • 100-Block Engine</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-800/80 bg-slate-950/60 flex-col justify-between custom-scrollbar overflow-y-auto shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 bg-slate-950 border-r border-slate-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
