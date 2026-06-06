import React from 'react';

export default function InsightPanel({ insights }) {
  if (!insights || insights.length === 0) return null;

  const icons = ['🔍', '📊', '🤖', '✨', '🎯', '⚡'];

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-abb-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-abb-purple/15 border border-abb-purple/25 flex items-center justify-center">
          <svg className="w-4 h-4 text-abb-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">AI-Generated Insights</h3>
          <p className="text-slate-500 text-xs">Adaptive analysis by ML engine</p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-abb-purple/20 transition-colors duration-200"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{icons[i % icons.length]}</span>
            <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-abb-accent/5 border border-abb-accent/10">
          <svg className="w-4 h-4 text-abb-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-slate-500">
            Insights are generated automatically based on dataset structure, feature types, and model performance.
          </p>
        </div>
      </div>
    </div>
  );
}
