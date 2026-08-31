import React, { useState } from 'react';
import { Badge } from './Badge';
import {
  CheckCircle2,
  Circle,
  Zap,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const CustomerOnboarding = ({ mt5, license, bot, onOpenMt5Setup }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isConnected = Boolean(mt5?.is_connected);
  const isRunning = bot?.status === 'RUNNING';
  const isDemo = (bot?.mode || 'DEMO') === 'DEMO';

  const steps = [
    {
      num: 1,
      title: 'Account & License Setup',
      desc: `License Key ${license?.license_key || 'TF-GOLD-8829-9401-K9X2'} is active.`,
      done: Boolean(license?.id),
    },
    {
      num: 2,
      title: 'Prepare MetaTrader 5',
      desc: 'Open MT5 on your Windows PC or Windows VPS and login to your broker account.',
      done: true,
    },
    {
      num: 3,
      title: 'Install Expert Advisor',
      desc: 'Copy TechForexGoldBot.mq5 into your MQL5/Experts folder and compile in MetaEditor.',
      done: isConnected,
    },
    {
      num: 4,
      title: 'Enable WebRequest URL',
      desc: 'Add API endpoint to Tools -> Options -> Expert Advisors -> Allow WebRequest.',
      done: isConnected,
    },
    {
      num: 5,
      title: 'Attach EA & Verify Heartbeat',
      desc: isConnected ? `MT5 Connected (Account #${mt5.account_number})` : 'Attach EA to XAUUSD M5 chart and enter license key.',
      done: isConnected,
    },
    {
      num: 6,
      title: 'Run in DEMO Mode First',
      desc: isRunning ? 'Bot is running in safe Demo / Paper trading mode.' : 'Start the bot and verify automated trade execution.',
      done: isRunning && isDemo,
    },
    {
      num: 7,
      title: 'Enable LIVE Trading',
      desc: 'Switch to Live mode only after testing demo performance and confirming risk settings.',
      done: !isDemo && isRunning,
    }
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="glass-card rounded-2xl border border-slate-800 p-5 shadow-lg bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gold-gradient text-slate-950 font-black shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Let's Connect Your Trading Bot</h2>
              <Badge variant={progressPercent === 100 ? 'success' : 'gold'} size="xs">
                {completedSteps} of {steps.length} Steps Ready ({progressPercent}%)
              </Badge>
            </div>
            <p className="text-xs text-slate-400">Step-by-step setup guide for non-technical traders.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMt5Setup && (
            <button
              onClick={onOpenMt5Setup}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
            >
              <Zap size={14} className="text-amber-400" />
              <span>EA Setup Guide</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
          >
            <span className="text-[11px]">{isExpanded ? 'Hide Steps' : 'View Checklist'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
        <div
          className="gold-gradient h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Expandable Step List */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                step.done
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {step.done ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <Circle size={16} className="text-slate-500" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold flex items-center gap-2">
                  <span className={step.done ? 'text-emerald-300' : 'text-slate-300'}>
                    Step {step.num}: {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
