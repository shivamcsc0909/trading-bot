import React from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { TelegramIcon } from './TelegramIcon';
import { Globe, ShieldCheck, Mail } from 'lucide-react';

export const Footer = ({ onNavigateAbout }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-6 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Description */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-100 gold-text tracking-wider">{APP_CONFIG.COMPANY_NAME}</span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-slate-400 text-[11px]">{APP_CONFIG.TAGLINE}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            &copy; {currentYear} {APP_CONFIG.COMPANY_NAME}. All rights reserved.
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-4 text-xs font-semibold flex-wrap justify-center">
          <a
            href={APP_CONFIG.WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition"
          >
            <Globe size={14} className="text-amber-400" />
            <span>Official Website</span>
          </a>

          <a
            href={APP_CONFIG.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition"
          >
            <TelegramIcon size={14} />
            <span>Telegram Channel</span>
          </a>

          {onNavigateAbout && (
            <button
              onClick={onNavigateAbout}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              About
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Demo Mode First</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
