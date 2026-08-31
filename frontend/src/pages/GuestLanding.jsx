import React from 'react';
import { APP_CONFIG } from '../config/appConfig';
import { TelegramIcon } from '../components/TelegramIcon';
import { Footer } from '../components/Footer';
import {
  Cpu,
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Lock,
  MessageCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const GuestLanding = ({ onGoToLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Public Header Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gold-gradient shadow-md shadow-amber-500/20 shrink-0">
              <Cpu className="h-5 w-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-wider gold-text">{APP_CONFIG.COMPANY_NAME}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                  MT5 PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">{APP_CONFIG.TAGLINE}</p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href={APP_CONFIG.WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
            >
              <Globe size={14} className="text-amber-400" />
              <span>fxtraderinfo.com</span>
            </a>

            <a
              href={APP_CONFIG.TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-950/30 border border-transparent hover:border-sky-800/40 transition"
            >
              <TelegramIcon size={14} />
              <span>Telegram</span>
            </a>

            <button
              onClick={onGoToLogin}
              className="gold-gradient hover:opacity-95 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <span>Sign In</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
            <Zap size={14} className="text-amber-400" />
            <span>ALGORITHMIC TRADING CONNECTED TO METATRADER 5</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Next-Generation MT5 Trading Automation by <span className="gold-text">{APP_CONFIG.COMPANY_NAME}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A commercially structured automated trading platform connecting MetaTrader 5 with multi-level price action strategies, institutional risk management, and real-time cloud telemetry.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto gold-gradient hover:opacity-95 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Access Trader Dashboard</span>
              <ArrowRight size={16} />
            </button>

            <a
              href={APP_CONFIG.WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-2 transition"
            >
              <Globe size={16} className="text-amber-400" />
              <span>Visit Official Website</span>
            </a>

            <a
              href={APP_CONFIG.TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 flex items-center justify-center gap-2 transition"
            >
              <TelegramIcon size={16} />
              <span>Telegram Support</span>
            </a>
          </div>

          {/* Demo Mode First Badge */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Strict <strong>Demo / Paper Trading First</strong> Policy Enforced</span>
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-8 pt-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">How FXTRADER Operates</h2>
            <p className="text-xs text-slate-400">Clean three-tier architecture ensuring millisecond execution with zero reliance on cloud hosting for MT5 trade commands.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-bold font-mono">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-100">1. Cloud Web API & Auth</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lightweight REST API orchestrates commercial license verification, strategy parameters, risk ceilings, and real-time dashboard telemetry.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-100">2. MQL5 Expert Advisor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Native MQL5 EA attaches to your MT5 chart on Windows PC or VPS, communicating securely with the backend via encrypted WebRequest.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-100">3. Execution & Risk Guard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The bot evaluates 100-block price levels and candlestick confirmations, applying dynamic 1-2% lot sizing and daily loss limits.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="glass-card rounded-3xl border border-slate-800 p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Core Trading Capabilities</h2>
              <p className="text-xs text-slate-400">Engineered for stability, precision, and strict capital defense.</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">FXTRADER MT5 Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>100-Block Level Engine</span>
              </div>
              <p className="text-slate-400 leading-relaxed">Deterministic cycle breakout and retest levels on Gold (XAUUSD M5).</p>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>Candlestick Confirmation</span>
              </div>
              <p className="text-slate-400 leading-relaxed">Pin Bar, Hammer (wick &ge; 2x body), and Engulfing trigger filters.</p>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>3 Daily SL Kill Switch</span>
              </div>
              <p className="text-slate-400 leading-relaxed">Automatic trading suspension upon 3 stop-loss hits in a single day.</p>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>Dynamic Lot Size Calculator</span>
              </div>
              <p className="text-slate-400 leading-relaxed">Computes volume based on live equity, tick value, and 1-2% risk ratio.</p>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>Session & News Filters</span>
              </div>
              <p className="text-slate-400 leading-relaxed">Automated protection around NFP, CPI, FOMC, and low-volume sessions.</p>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-400" />
                <span>Master Bot Kill Switch</span>
              </div>
              <p className="text-slate-400 leading-relaxed">Instant remote stop control available to both traders and administrators.</p>
            </div>
          </div>
        </section>

        {/* Official Website & Purchase Access CTA */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 shadow-2xl space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">Want to use FXTRADER?</span>
            <h2 className="text-2xl font-bold text-slate-100">Get Access to the Platform</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              To purchase FXTRADER access and obtain your commercial license key, please visit our official website. All licensing and payment processing are managed securely through our main portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={APP_CONFIG.WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto gold-gradient hover:opacity-95 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Globe size={16} />
              <span>VISIT OFFICIAL WEBSITE (fxtraderinfo.com)</span>
            </a>

            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-2"
            >
              <Lock size={14} />
              <span>Already have an account? Sign In</span>
            </button>
          </div>
        </section>

        {/* Telegram Support Query Section */}
        <section className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-sky-400 font-bold text-sm">
              <TelegramIcon size={18} />
              <span>Have a question or need assistance?</span>
            </div>
            <h3 className="text-base font-bold text-slate-100">Official Telegram Community & Support</h3>
            <p className="text-xs text-slate-400">Contact us through our Telegram channel for queries, setup assistance, and platform updates.</p>
          </div>

          <a
            href={APP_CONFIG.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl text-xs font-bold bg-sky-950 border border-sky-700/60 text-sky-300 hover:bg-sky-900 flex items-center gap-2 shadow-lg shadow-sky-950/40 shrink-0 transition"
          >
            <TelegramIcon size={16} />
            <span>Join Telegram Channel</span>
          </a>
        </section>

        {/* About FXTRADER Section */}
        <section className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Cpu size={18} />
            <span>ABOUT FXTRADER</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Professional Automated Trading Technology</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            FXTRADER is a commercial trading technology provider specializing in deterministic algorithmic models, MT5 integration architectures, and institutional risk management suites. We prioritize capital preservation, risk-to-reward consistency, and non-discretionary execution standards.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-slate-400">Official Website</div>
              <a
                href={APP_CONFIG.WEBSITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>{APP_CONFIG.WEBSITE_URL}</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-slate-400">Telegram Channel</div>
              <a
                href={APP_CONFIG.TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>Telegram Support Channel</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <Footer onNavigateAbout={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} />
    </div>
  );
};
