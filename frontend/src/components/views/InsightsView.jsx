import React from 'react';
import { Sparkles, TrendingUp, Layers, Calendar, ArrowRight, MessageSquare, ArrowLeft } from 'lucide-react';

const InsightsView = ({ dataset, onAskQuestion, onBackToChat }) => {
  if (!dataset) {
    return (
      <div className="saas-card p-12 text-center text-xs text-slate-400 bg-[#0E1628] border border-white/10">
        No dataset selected. Upload or choose a dataset to generate analytical insights.
      </div>
    );
  }

  const { filename, schema = {}, rowCount = 0 } = dataset;
  const cols = Object.keys(schema);

  const numericCols = cols.filter((c) => schema[c]?.type === 'numeric');
  const dateCols = cols.filter((c) => schema[c]?.type === 'date');
  const catCols = cols.filter((c) => schema[c]?.type === 'categorical' || schema[c]?.type === 'text');

  const primaryMetric = numericCols[0] || 'records';
  const primaryCat = catCols[0] || 'category';

  const quickQuestions = [
    `What is the total ${primaryMetric}?`,
    `Break down ${primaryMetric} by ${primaryCat}`,
    `Show the top 5 ${primaryCat} by ${primaryMetric}`,
    `What is the average ${primaryMetric}?`
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F1F5F9] tracking-tight">
            Automated Insights &amp; Findings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Statistical breakdown and query starters for <span className="font-bold text-slate-200">{filename}</span>
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

      {/* 4 Feature Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card p-4 bg-[#0E1628] border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">Numeric Metrics</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#F1F5F9]">{numericCols.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {numericCols.slice(0, 3).join(', ') || 'None detected'}
          </p>
        </div>

        <div className="saas-card p-4 bg-[#0E1628] border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">Time Dimensions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#F1F5F9]">{dateCols.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {dateCols.slice(0, 2).join(', ') || 'No date columns'}
          </p>
        </div>

        <div className="saas-card p-4 bg-[#0E1628] border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">Categorical Groups</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#F1F5F9]">{catCols.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {catCols.slice(0, 3).join(', ') || 'None'}
          </p>
        </div>

        <div className="saas-card p-4 bg-[#0E1628] border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-400">Data Records</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#F1F5F9]">{rowCount.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Available for DuckDB SQL</p>
        </div>
      </div>

      {/* Suggested Quick Questions Grid */}
      <div className="saas-card p-5 bg-[#0E1628] border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-[#F1F5F9]">
            Recommended Questions for this Dataset
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Click any analytical question to execute it immediately in the conversational workspace.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onAskQuestion?.(q)}
              className="p-3.5 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 hover:border-indigo-500/40 text-left transition-all flex items-center justify-between group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/5 text-indigo-400 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {q}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
