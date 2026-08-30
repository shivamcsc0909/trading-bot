import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, isCurrency = false, highlight = false }) => {
  const formatVal = (v) => {
    if (v === undefined || v === null) return '—';
    if (isCurrency) {
      const num = typeof v === 'number' ? v : parseFloat(v);
      const prefix = num >= 0 ? '$' : '-$';
      return `${prefix}${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return v;
  };

  const isPositive = typeof value === 'number' ? value >= 0 : !String(value).startsWith('-');

  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 ${
      highlight 
        ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30 shadow-lg shadow-amber-950/20' 
        : 'glass-card border-slate-800/80 hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${highlight ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800/80 text-slate-400'}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className={`text-2xl font-bold tracking-tight font-mono ${
          isCurrency && typeof value === 'number'
            ? value > 0 ? 'text-emerald-400' : value < 0 ? 'text-rose-400' : 'text-slate-100'
            : highlight ? 'text-amber-400' : 'text-slate-100'
        }`}>
          {formatVal(value)}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            trend > 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
          }`}>
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
