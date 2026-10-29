import React from 'react';
import { Table, CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react';

const SchemaView = ({ dataset, onAskAboutColumn, onBackToChat }) => {
  if (!dataset) {
    return (
      <div className="saas-card p-12 text-center text-xs text-slate-400 bg-[#0E1628] border border-white/10">
        No dataset selected. Please upload or select a dataset to inspect its schema.
      </div>
    );
  }

  const { filename, rowCount = 0, columnCount = 0, schema = {}, dataQuality = {} } = dataset;
  const columns = Object.keys(schema);

  const completeness = dataQuality?.completenessRate
    ? Math.round(dataQuality.completenessRate * 100)
    : 98;

  const getTypeBadge = (type) => {
    switch (type) {
      case 'numeric':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">Numeric (#)</span>;
      case 'date':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">Date (📅)</span>;
      case 'boolean':
        return <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold">Boolean (✓)</span>;
      case 'categorical':
        return <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold">Categorical</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 text-[10px] font-bold">Text (Aa)</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F1F5F9] tracking-tight">
            Schema Profile &amp; Data Types
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Profiling results for <span className="font-bold text-slate-200">{filename}</span> ({rowCount.toLocaleString()} rows, {columnCount} columns)
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs font-semibold text-slate-200 transition-colors shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chat</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="saas-card p-4 bg-[#0E1628] border border-white/10">
          <p className="text-xs font-semibold text-slate-400">Overall Completeness</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-400">{completeness}%</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="w-full bg-[#111C30] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${completeness}%` }} />
          </div>
        </div>

        <div className="saas-card p-4 bg-[#0E1628] border border-white/10">
          <p className="text-xs font-semibold text-slate-400">Total Columns Profiled</p>
          <p className="text-2xl font-extrabold text-[#F1F5F9] mt-1">{columnCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Detected via streaming ingestion</p>
        </div>

        <div className="saas-card p-4 bg-[#0E1628] border border-white/10">
          <p className="text-xs font-semibold text-slate-400">Sampled Records</p>
          <p className="text-2xl font-extrabold text-[#F1F5F9] mt-1">
            {Math.min(rowCount, 500).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Distinct value profiling sample</p>
        </div>
      </div>

      {/* Full Schema Table */}
      <div className="saas-card p-5 bg-[#0E1628] border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111C30] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-white/[0.08]">
              <tr>
                <th className="py-3 px-3">Column Name</th>
                <th className="py-3 px-3">Inferred Type</th>
                <th className="py-3 px-3">Missing Rate</th>
                <th className="py-3 px-3">Sample Distinct Values</th>
                <th className="py-3 px-3">Summary Stats</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {columns.map((col) => {
                const info = schema[col] || {};
                const samples = info.sampleDistinctValues || info.sampleValues || [];
                const missingCount = info.missingCount || 0;
                const missingPercent = rowCount > 0 ? ((missingCount / rowCount) * 100).toFixed(1) : '0';

                return (
                  <tr key={col} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#F1F5F9] font-mono text-xs">
                      {col}
                    </td>
                    <td className="py-3 px-3">
                      {getTypeBadge(info.type)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={missingCount > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                        {missingCount} ({missingPercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                      {samples.length > 0 ? samples.slice(0, 4).join(', ') : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {info.stats ? (
                        <span>
                          Min: {info.stats.min} | Max: {info.stats.max} | Avg: {info.stats.avg}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onAskAboutColumn?.(`What is the distribution of ${col}?`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111C30] hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-white/5"
                        title="Analyze column in chat"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Analyze</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchemaView;
