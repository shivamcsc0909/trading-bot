import React from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../config/appConfig';
import { TelegramIcon } from './TelegramIcon';
import { Badge } from './Badge';
import { Power, ShieldCheck, LogOut, Cpu, Menu, X, HelpCircle, Globe } from 'lucide-react';

export const Navbar = ({ botData, onToggleBot, onToggleMode, onOpenHelp, onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout, isAdmin } = useAuth();

  const isRunning = botData?.status === 'RUNNING';
  const isDemo = (botData?.mode || 'DEMO') === 'DEMO';
  const isConnected = botData?.is_connected;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-2">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gold-gradient shadow-md shadow-amber-500/20 shrink-0">
              <Cpu className="h-5 w-5 text-slate-950 font-black" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-wider gold-text">{APP_CONFIG.COMPANY_NAME}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                  MT5 PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{APP_CONFIG.TAGLINE}</p>
            </div>
          </div>
        </div>

        {/* Real-time Status Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Official Links */}
          <a
            href={APP_CONFIG.WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Official Website"
            className="hidden xl:flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-amber-400 px-2 py-1 rounded bg-slate-900/60 border border-slate-800"
          >
            <Globe size={13} className="text-amber-400" />
            <span>fxtraderinfo.com</span>
          </a>

          <a
            href={APP_CONFIG.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Telegram Channel"
            className="hidden xl:flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 px-2 py-1 rounded bg-sky-950/40 border border-sky-800/40"
          >
            <TelegramIcon size={13} />
            <span>Telegram</span>
          </a>

          {/* MT5 Terminal Connection */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg">
            <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-medium text-slate-300">
              {isConnected ? 'MT5 Online' : 'MT5 Offline'}
            </span>
          </div>

          {/* Mode Switch (DEMO / LIVE) */}
          <button
            onClick={onToggleMode}
            title="Toggle Demo / Live mode"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
              isDemo
                ? 'bg-sky-950/70 border-sky-600/40 text-sky-300 hover:bg-sky-900/60'
                : 'bg-rose-950/70 border-rose-600/50 text-rose-300 hover:bg-rose-900/60 shadow-lg shadow-rose-950/40 animate-pulse'
            }`}
          >
            <ShieldCheck size={14} className={isDemo ? 'text-sky-400' : 'text-rose-400'} />
            <span className="hidden sm:inline">{isDemo ? 'DEMO MODE' : 'LIVE TRADING'}</span>
            <span className="sm:hidden">{isDemo ? 'DEMO' : 'LIVE'}</span>
          </button>

          {/* Master Bot Kill Switch */}
          <button
            onClick={onToggleBot}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm shrink-0 ${
              isRunning
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
            }`}
          >
            <Power size={14} className={isRunning ? 'text-emerald-400' : 'text-rose-400'} />
            <span className="hidden sm:inline">{isRunning ? 'BOT ACTIVE' : 'BOT STOPPED'}</span>
            <span className="sm:hidden">{isRunning ? 'ON' : 'STOP'}</span>
          </button>

          {/* Quick Help Button */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              title="Help & Guides"
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              <HelpCircle size={16} />
            </button>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{user?.full_name || 'User'}</div>
              <div className="text-[10px] text-amber-400 font-semibold">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
