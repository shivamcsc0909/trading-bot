import React from 'react';
import { Badge } from '../../components/Badge';
import { Zap, Copy, CheckCircle2, AlertCircle, Shield, Terminal } from 'lucide-react';

export const Mt5View = ({ data }) => {
  const mt5 = data?.mt5 || {};
  const license = data?.license || {};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard: ' + text);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">MetaTrader 5 Connector Setup</h1>
        <p className="text-xs text-slate-400 mt-1">Details for attaching the MQL5 Expert Advisor to your MT5 Terminal on Windows PC or VPS.</p>
      </div>

      {/* Connection Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">MT5 Account Details</h2>
              <p className="text-xs text-slate-400">Synchronized via HTTPS WebRequest</p>
            </div>
          </div>
          <Badge variant={mt5?.is_connected ? 'success' : 'danger'}>
            {mt5?.is_connected ? 'CONNECTED & SYNCED' : 'OFFLINE'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Trading Account Number</div>
            <div className="text-base font-bold font-mono text-slate-100 mt-1">#{mt5?.account_number || 50198234}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">Broker & Server</div>
            <div className="text-base font-bold font-mono text-slate-100 mt-1">{mt5?.broker || 'MetaQuotes-Demo'} ({mt5?.server || 'Demo'})</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">License Key Required in EA</div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono font-bold text-amber-400 text-sm">{license?.license_key || 'TF-GOLD-8829-9401-K9X2'}</span>
              <button
                onClick={() => copyToClipboard(license?.license_key || 'TF-GOLD-8829-9401-K9X2')}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-slate-400">EA Version & Protocol</div>
            <div className="text-base font-bold font-mono text-slate-100 mt-1">v{mt5?.ea_version || '1.0.0'} (JSON over HTTPS)</div>
          </div>
        </div>

        {/* Setup Steps Runbook */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={14} /> MT5 Expert Advisor Setup Instructions
          </h3>
          <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <li>Open MetaTrader 5 on your Windows PC or Windows VPS.</li>
            <li>Copy <code className="text-amber-400 font-mono">TechForexGoldBot.mq5</code> into your <code className="font-mono text-slate-200">MQL5/Experts</code> folder and compile it in MetaEditor.</li>
            <li>Go to <strong>Tools → Options → Expert Advisors</strong>.</li>
            <li>Check <strong>"Allow WebRequest for listed URL"</strong> and add your API URL (e.g., <code className="text-amber-400 font-mono">http://localhost:8000</code> or your live domain).</li>
            <li>Check <strong>"Allow Algo Trading"</strong> in the MT5 top toolbar.</li>
            <li>Drag and drop the EA onto an <strong>XAUUSD M5</strong> chart.</li>
            <li>Paste your License Key <code className="text-amber-400 font-mono">{license?.license_key || 'TF-GOLD-8829-9401-K9X2'}</code> in the EA inputs and click OK.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
