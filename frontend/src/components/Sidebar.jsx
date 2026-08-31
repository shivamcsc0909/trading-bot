import React from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/appConfig';
import { TelegramIcon } from './TelegramIcon';
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
  Compass,
  Globe,
  Info
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
    { id: 'help', label: 'Help & FAQ', icon: HelpCircle },
    { id: 'about', label: 'About & Support', icon: Info },
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
          <div className="text-xs font-black gold-text">{APP_CONFIG.COMPANY_NAME}</div>
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

        {/* Official Channels Quick Links */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Links</div>
          <a
            href={APP_CONFIG.WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-slate-300 hover:text-amber-400 py-1 transition"
          >
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-amber-400" />
              <span className="text-[11px]">Official Website</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">&rarr;</span>
          </a>

          <a
            href={APP_CONFIG.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-sky-400 hover:text-sky-300 py-1 transition"
          >
            <div className="flex items-center gap-2">
              <TelegramIcon size={14} />
              <span className="text-[11px]">Telegram Support</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">&rarr;</span>
          </a>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-center">
        <div className="text-[10px] text-slate-400 font-bold">{APP_CONFIG.COMPANY_NAME} MT5</div>
        <div className="text-[10px] text-amber-500/80 font-mono">Demo First • 100-Block Engine</div>
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
