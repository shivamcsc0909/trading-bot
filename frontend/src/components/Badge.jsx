import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const styles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
    info: 'bg-sky-950/80 text-sky-400 border-sky-800/60',
    gold: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    purple: 'bg-purple-950/80 text-purple-400 border-purple-800/60',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] font-semibold',
    sm: 'px-2.5 py-1 text-xs font-semibold',
    md: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${styles[variant] || styles.default} ${sizes[size]}`}>
      {children}
    </span>
  );
};
