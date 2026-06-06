import React from 'react';

export default function DataPreview({ data, columns }) {
  if (!data || data.length === 0 || !columns || columns.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-abb-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-abb-green"></div>
          <h3 className="text-white font-semibold text-sm">Dataset Preview</h3>
        </div>
        <span className="badge badge-blue">
          {data.length} rows · {columns.length} cols
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-slate-600 w-10">#</th>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="text-slate-600 font-mono text-xs">{rowIdx + 1}</td>
                {columns.map((col) => {
                  const val = row[col];
                  const isEmpty = val === '' || val === null || val === undefined;
                  return (
                    <td key={col} className={isEmpty ? 'text-red-400/60 italic' : ''}>
                      {isEmpty ? 'null' : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-abb-border">
        <p className="text-xs text-slate-600">Showing first {data.length} rows · Null values highlighted in red</p>
      </div>
    </div>
  );
}
