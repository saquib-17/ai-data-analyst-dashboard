import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Layers, Calendar, ArrowRight, MessageSquare, ArrowLeft } from 'lucide-react';

const InsightsView = ({ dataset, onAskQuestion, onBackToChat }) => {
  if (!dataset) {
    return (
      <div className="saas-card p-12 text-center text-xs text-slate-400">
        No dataset selected. Upload or choose a dataset to generate analytical insights.
      </div>
    );
  }

  const { filename, schema = {}, rowCount = 0, columnCount = 0 } = dataset;
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Automated Insights &amp; Findings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Statistical breakdown and query starters for <span className="font-bold text-slate-800">{filename}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chat</span>
        </button>
      </div>

      {/* 4 Feature Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="saas-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Numeric Metrics</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{numericCols.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {numericCols.slice(0, 3).join(', ') || 'None detected'}
          </p>
        </div>

        <div className="saas-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Time Dimensions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{dateCols.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {dateCols.slice(0, 2).join(', ') || 'No date columns'}
          </p>
        </div>

        <div className="saas-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Categorical Groups</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{catCols.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {catCols.slice(0, 3).join(', ') || 'None'}
          </p>
        </div>

        <div className="saas-card p-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Data Records</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-brand-purple flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{rowCount.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Available for DuckDB SQL</p>
        </div>
      </div>

      {/* Suggested Quick Questions Grid */}
      <div className="saas-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-indigo" />
          <h2 className="text-sm font-bold text-slate-900">
            Recommended Questions for this Dataset
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Click any analytical question to execute it immediately in the conversational workspace.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onAskQuestion?.(q)}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-brand-indigo/40 text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white text-brand-indigo flex items-center justify-center shadow-2xs group-hover:bg-brand-indigo group-hover:text-white transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-brand-indigo transition-colors">
                  {q}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-indigo group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightsView;

