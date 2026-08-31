import React, { useState } from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { TelegramIcon } from '../../components/TelegramIcon';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  Power,
  AlertTriangle,
  FileQuestion,
  Search,
  Globe
} from 'lucide-react';

export const HelpView = () => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: `How do I connect ${APP_CONFIG.COMPANY_NAME} to my MetaTrader 5 terminal?`,
      a: 'Download or copy TechForexGoldBot.mq5 into your MT5 "MQL5/Experts" directory. Compile it in MetaEditor, enable Algo Trading in MT5, add your backend API URL in Tools -> Options -> Expert Advisors -> WebRequest, and attach the EA to an XAUUSD M5 chart with your license key.'
    },
    {
      q: 'What is the difference between DEMO Mode and LIVE Mode?',
      a: 'DEMO mode executes paper trades on your demo account without risking real money. LIVE mode trades on real funded accounts. The platform defaults to DEMO mode first. You must explicitly confirm before switching to LIVE trading.'
    },
    {
      q: 'What happens when I click "STOP BOT (KILL SWITCH)"?',
      a: 'Stopping the bot immediately deactivates the signal execution engine. The EA will NOT open any new trades. Any currently open positions remain managed by their stop loss and take profit targets.'
    },
    {
      q: 'What does "3 Daily Stop Loss Limit" mean?',
      a: 'If the bot encounters 3 stop loss hits in a single calendar day, all trading is automatically halted until the next day to preserve your capital.'
    },
    {
      q: 'What should I do if MT5 shows "Disconnected / Offline"?',
      a: '1. Verify your Windows MT5 terminal is open and connected to the internet.\n2. Ensure "Algo Trading" button is green.\n3. Check that your API URL is listed under Tools -> Options -> Expert Advisors -> Allow WebRequest.\n4. Check the "Experts" tab at the bottom of MT5 for error codes.'
    },
    {
      q: 'How does dynamic lot sizing calculate trade volume?',
      a: 'The bot uses your account equity, risk % (default 2%), and the stop loss distance (in points) along with your broker\'s tick value to dynamically compute the exact lot size, adhering to minimum and maximum lot limits.'
    },
    {
      q: 'Why does the bot skip trading between 9:00 AM and 2:00 PM IST?',
      a: 'This is the Strategy Filter F1 rule. The Asian session morning hours for Gold frequently exhibit choppy low-volume ranges. The bot focuses on high-liquidity European and US sessions.'
    }
  ];

  const filtered = faqs.filter(
    (f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">{APP_CONFIG.COMPANY_NAME} Help Center & FAQ</h1>
        <p className="text-xs text-slate-400 mt-1">Simple guides and explanations for operating your automated trading bot.</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides, setup questions, error solutions..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
        />
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {filtered.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="glass-card rounded-xl border border-slate-800 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-200 hover:text-amber-400 transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileQuestion size={16} className="text-amber-400 shrink-0" />
                  <span>{item.q}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-slate-800/60 leading-relaxed whitespace-pre-line bg-slate-900/30 font-sans">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Box with Telegram & Website Links */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-bold text-slate-200">Have a question or need assistance?</div>
          <p className="text-slate-400 text-[11px]">Contact us through our Telegram channel or visit our official website.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={APP_CONFIG.TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sky-950 border border-sky-800/60 text-sky-300 hover:bg-sky-900 font-bold px-3.5 py-2 rounded-lg shrink-0 flex items-center gap-1.5 transition"
          >
            <TelegramIcon size={14} />
            <span>Telegram</span>
          </a>
          <a
            href={APP_CONFIG.WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="gold-gradient text-slate-950 font-bold px-3.5 py-2 rounded-lg shrink-0 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Globe size={14} />
            <span>Website</span>
          </a>
        </div>
      </div>
    </div>
  );
};
