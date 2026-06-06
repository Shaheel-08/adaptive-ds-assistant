import React from 'react';

const COLOR_MAP = {
  blue:   { bg: 'bg-abb-accent/10',  border: 'border-abb-accent/20',  text: 'text-abb-accent',  icon: 'text-abb-accent',  fill: 'bg-abb-accent' },
  purple: { bg: 'bg-abb-purple/10', border: 'border-abb-purple/20', text: 'text-abb-purple', icon: 'text-abb-purple', fill: 'bg-abb-purple' },
  green:  { bg: 'bg-abb-green/10',  border: 'border-abb-green/20',  text: 'text-abb-green',  icon: 'text-abb-green',  fill: 'bg-abb-green' },
  yellow: { bg: 'bg-abb-yellow/10', border: 'border-abb-yellow/20', text: 'text-abb-yellow', icon: 'text-abb-yellow', fill: 'bg-abb-yellow' },
  red:    { bg: 'bg-abb-red/10',    border: 'border-abb-red/20',    text: 'text-abb-red',    icon: 'text-abb-red',    fill: 'bg-abb-red' },
  cyan:   { bg: 'bg-abb-cyan/10',   border: 'border-abb-cyan/20',   text: 'text-abb-cyan',   icon: 'text-abb-cyan',   fill: 'bg-abb-cyan' },
};

export default function MetricCard({ label, value, subtitle, icon, color = 'blue', progress }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className={`glass-card p-5 border ${c.border} animate-slide-up`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <span className={`text-xl ${c.icon}`}>{icon}</span>
        </div>
        {progress !== undefined && (
          <span className={`text-xs font-mono font-bold ${c.text}`}>{progress}%</span>
        )}
      </div>

      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c.text} leading-tight`}>{value}</p>
      {subtitle && <p className="text-slate-500 text-xs mt-1 truncate">{subtitle}</p>}

      {progress !== undefined && (
        <div className="progress-bar mt-3">
          <div
            className={`progress-fill ${c.fill}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
