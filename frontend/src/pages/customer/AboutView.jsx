import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { TelegramIcon } from '../../components/TelegramIcon';
import { Cpu, Globe, ExternalLink, ShieldCheck, Mail, BookOpen, AlertTriangle } from 'lucide-react';

export const AboutView = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">About {APP_CONFIG.COMPANY_NAME} & Support</h1>
        <p className="text-xs text-slate-400 mt-1">Official platform information, company website, and Telegram support links.</p>
      </div>

      {/* Main Brand Box */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gold-gradient shadow-md shadow-amber-500/20 shrink-0">
            <Cpu className="h-6 w-6 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wider gold-text">{APP_CONFIG.COMPANY_NAME}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                v{APP_CONFIG.VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-400">{APP_CONFIG.TAGLINE}</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {APP_CONFIG.COMPANY_NAME} delivers automated algorithmic trading solutions for MetaTrader 5. Built upon deterministic market structure models, 100-block price action level recognition, and strict risk preservation parameters.
        </p>

        {/* Official Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <a
            href={APP_CONFIG.WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Globe size={16} />
                <span>Official Website</span>
              </div>
              <ExternalLink size={14} className="text-slate-400" />
            </div>
            <div className="text-xs font-mono font-bold text-slate-100">{APP_CONFIG.WEBSITE_URL}</div>
            <p className="text-[11px] text-slate-400">Visit for announcements, licenses, and product documentation.</p>
          </a>

          <a
            href={APP_CONFIG.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 transition space-y-2 block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <TelegramIcon size={16} />
                <span>Telegram Support Channel</span>
              </div>
              <ExternalLink size={14} className="text-slate-400" />
            </div>
            <div className="text-xs font-mono font-bold text-sky-300">Join Official Channel</div>
            <p className="text-[11px] text-slate-400">Direct query resolution, bot operational updates, and community.</p>
          </a>
        </div>
      </div>

      {/* Safety & Risk Notice */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
          <AlertTriangle size={16} />
          <span>Risk Disclosure & Best Practices</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Automated algorithmic trading involves significant market risk. Always test all strategies thoroughly in <strong>DEMO Mode</strong> before deploying live funds. Ensure your risk parameters (maximum risk per trade, daily stop-loss limit) align with your personal risk tolerance.
        </p>
      </div>
    </div>
  );
};
