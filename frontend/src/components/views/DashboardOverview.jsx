import React from 'react';
import {
  Upload,
  MessageSquare,
  Sparkles,
  Database,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  ChevronRight,
  Cpu,
  Layers,
  CheckCircle2
} from 'lucide-react';

const DashboardOverview = ({
  datasets = [],
  conversations = [],
  activeDataset = null,
  onUploadClick,
  onStartConversation,
  onSelectDataset,
  onSelectConversation,
  onViewAllDatasets,
  onViewAllConversations
}) => {
  const totalRows = datasets.reduce((acc, d) => acc + (d.rowCount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="saas-card p-6 sm:p-8 bg-gradient-to-r from-white via-indigo-50/40 to-purple-50/40 border border-indigo-100/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-200/20 via-indigo-200/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-brand-indigo border border-indigo-100 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
            <span>AI-Powered Conversational Analytics</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Turn Your Data Into Insights
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">
            Upload a CSV dataset, ask questions in plain English, and discover meaningful patterns, instant visualizations, and verified metrics.
          </p>

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <button
              type="button"
              onClick={onUploadClick}
              className="btn-gradient px-4 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Upload className="w-4 h-4 text-white" />
              <span className="text-white font-semibold">Upload Dataset</span>
            </button>

            <button
              type="button"
              onClick={onStartConversation}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-brand-indigo" />
              <span className="text-slate-800">Start New Conversation</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Datasets */}
        <div className="saas-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Datasets</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {datasets.length}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Persistent in SQLite & Disk</span>
          </p>
        </div>

        {/* Card 2: Total Rows */}
        <div className="saas-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Rows Indexed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {totalRows > 1000 ? `${(totalRows / 1000).toFixed(1)}K` : totalRows}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Available for SQL Querying</span>
          </p>
        </div>

        {/* Card 3: Saved Conversations */}
        <div className="saas-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Saved Threads</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {conversations.length}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Multi-turn analytical history
          </p>
        </div>

        {/* Card 4: Engine */}
        <div className="saas-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Query Engine</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-indigo-600 tracking-tight">
            DuckDB SQL
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            In-memory OLAP acceleration
          </p>
        </div>
      </div>

      {/* Two Column Section: Recent Datasets & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Datasets Table */}
        <div className="saas-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Datasets</h2>
              <p className="text-xs text-slate-500">Active datasets ready for analysis</p>
            </div>
            <button
              type="button"
              onClick={onViewAllDatasets}
              className="text-xs font-semibold text-indigo-600 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {datasets.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No datasets uploaded yet. Click "Upload Dataset" to begin.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {datasets.slice(0, 4).map((d) => (
                <div
                  key={d.id}
                  onClick={() => onSelectDataset(d.id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 rounded-xl px-2 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs group-hover:text-indigo-600">
                        {d.filename}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {d.rowCount} rows • {d.columnCount} columns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Ready
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations Card */}
        <div className="saas-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Conversations</h2>
              <p className="text-xs text-slate-500">Saved multi-turn chat threads</p>
            </div>
            <button
              type="button"
              onClick={onViewAllConversations}
              className="text-xs font-semibold text-indigo-600 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No conversations started yet. Click "Start New Conversation" to query your data.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 rounded-xl px-2 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs group-hover:text-indigo-600">
                        {c.title || 'Untitled Thread'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{c.messageCount || 0} msgs</span>
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
