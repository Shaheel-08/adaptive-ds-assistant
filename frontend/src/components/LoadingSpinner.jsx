import React from 'react';

export default function LoadingSpinner({ message = 'Analyzing dataset...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      {/* Orbital rings */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-abb-accent animate-spin"
          style={{ animationDuration: '1.2s' }}></div>
        {/* Middle ring */}
        <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-abb-purple animate-spin"
          style={{ animationDuration: '0.9s', animationDirection: 'reverse' }}></div>
        {/* Inner ring */}
        <div className="absolute inset-6 rounded-full border-2 border-transparent border-t-abb-cyan animate-spin"
          style={{ animationDuration: '0.6s' }}></div>
        {/* Core dot */}
        <div className="absolute inset-10 rounded-full bg-abb-accent/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-abb-accent animate-pulse"></div>
        </div>
      </div>

      <p className="text-white font-semibold text-lg mb-2">{message}</p>
      <p className="text-slate-500 text-sm mb-6">Detecting problem type and training models...</p>

      {/* Step indicators */}
      <div className="flex flex-col gap-2 w-64">
        {[
          'Reading & parsing CSV',
          'Detecting problem type',
          'Preprocessing features',
          'Training ML models',
          'Generating insights',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `rgba(59,130,246,${0.3 + i * 0.15})`,
                animation: `pulse ${1 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-abb-accent"></div>
            </div>
            <span className="text-slate-400 text-xs font-mono">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
