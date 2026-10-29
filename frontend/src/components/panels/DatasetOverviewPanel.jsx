import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  MessageSquare,
  Download,
  Calendar,
  Hash,
  Type,
  Globe,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ChevronRight,
  FolderOpen,
  BookOpen,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

const DatasetOverviewPanel = ({
  dataset,
  datasets = [],
  onSelectDataset,
  onUploadClick,
  onViewSchema,
  onViewInsights,
  onManageConversations,
  onExportCsv
}) => {
  const [showAllColumns, setShowAllColumns] = useState(false);

  // When no dataset is attached to current conversation
  if (!dataset) {
    return (
      <aside className="w-full xl:w-80 flex-shrink-0 space-y-4">
        {/* Card 1: Dataset Context */}
        <div className="saas-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Dataset Context</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 text-[10px] font-medium border border-white/[0.08]">
              No dataset attached
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Connect a dataset to start analyzing your data with AI.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onUploadClick}
              className="btn-gradient flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
            <button
              type="button"
              onClick={onViewInsights}
              className="flex-1 py-2 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs text-slate-300 font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Browse Datasets</span>
            </button>
          </div>
        </div>

        {/* Card 2: Dataset Preview (Empty State) */}
        <div className="saas-card p-5 text-center space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-white">Dataset Preview</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 text-[10px] font-medium border border-white/[0.08]">
              No dataset selected
            </span>
          </div>

          <div className="py-6 flex flex-col items-center justify-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-2 text-slate-400">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Upload a CSV file or select from your existing datasets to view schema and preview data.
            </p>
          </div>
        </div>

        {/* Card 3: Quick Actions */}
        <div className="saas-card p-4 space-y-2">
          <h3 className="text-xs font-bold text-white mb-2">Quick Actions</h3>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onUploadClick}
              className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-emerald-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Upload Dataset</p>
                  <p className="text-[10px] text-slate-400">Import a new CSV file</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onViewInsights}
              className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-purple-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Explore Datasets</p>
                  <p className="text-[10px] text-slate-400">Browse your data library</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onViewSchema}
              className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-blue-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">View Documentation</p>
                  <p className="text-[10px] text-slate-400">Learn how to use DataMind AI</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onManageConversations}
              className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-indigo-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Get Help</p>
                  <p className="text-[10px] text-slate-400">Support and guides</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // When a valid dataset IS attached
  const {
    filename = 'dataset.csv',
    rowCount = 0,
    columnCount = 0,
    schema = {},
    dataQuality = {},
    uploadedAt
  } = dataset;

  const completeness = dataQuality?.completenessRate 
    ? Math.round(dataQuality.completenessRate * 100)
    : 98;

  const columns = Object.keys(schema);
  const displayColumns = showAllColumns ? columns : columns.slice(0, 8);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'numeric':
        return <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-[10px] flex items-center justify-center font-mono">#</span>;
      case 'date':
        return <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-400 font-bold text-[10px] flex items-center justify-center">📅</span>;
      case 'boolean':
        return <span className="w-5 h-5 rounded-md bg-purple-500/15 text-purple-400 font-bold text-[10px] flex items-center justify-center">✓</span>;
      default:
        return <span className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-400 font-bold text-[10px] flex items-center justify-center font-mono">Aa</span>;
    }
  };

  return (
    <aside className="w-full xl:w-80 flex-shrink-0 space-y-4">
      {/* 1. Dataset Context Card (Matches Reference Image 2) */}
      <div className="saas-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            <span>Dataset Context</span>
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
            Active
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#111C30]/70 border border-white/[0.06]">
          <p className="text-xs font-bold text-white truncate max-w-[220px]" title={filename}>
            {filename}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {rowCount.toLocaleString()} rows • {columnCount || columns.length} columns • 2.4 MB
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onUploadClick}
            className="btn-gradient flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
          <button
            type="button"
            onClick={onViewInsights}
            className="flex-1 py-1.5 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs text-slate-300 font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Browse</span>
          </button>
        </div>
      </div>

      {/* 2. Schema Preview Card */}
      <div className="saas-card p-4 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <h3 className="text-xs font-bold text-white">Dataset Preview</h3>
          <button
            type="button"
            onClick={onViewSchema}
            className="text-[11px] font-semibold text-indigo-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Full Schema</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          {displayColumns.map((col) => {
            const info = schema[col] || {};
            const type = info.type || 'string';
            return (
              <div
                key={col}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#111C30]/40 hover:bg-[#111C30] border border-white/[0.04] transition-colors text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {getTypeIcon(type)}
                  <span className="font-semibold text-slate-200 truncate">{col}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 capitalize">{type}</span>
              </div>
            );
          })}
        </div>

        {columns.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="w-full mt-2 pt-2 border-t border-white/[0.06] text-center text-[11px] font-medium text-slate-400 hover:text-indigo-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{showAllColumns ? 'Show fewer' : `Show more columns (${columns.length - 8})`}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllColumns ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* 3. Quick Actions Card (Matches Reference Image 2) */}
      <div className="saas-card p-4 space-y-2">
        <h3 className="text-xs font-bold text-white mb-2">Quick Actions</h3>

        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onUploadClick}
            className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-emerald-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Upload Dataset</p>
                <p className="text-[10px] text-slate-400">Import a new CSV file</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onViewInsights}
            className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-purple-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Explore Datasets</p>
                <p className="text-[10px] text-slate-400">Browse your data library</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onViewSchema}
            className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-blue-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">View Documentation</p>
                <p className="text-[10px] text-slate-400">Learn how to use DataMind AI</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onManageConversations}
            className="w-full p-2.5 rounded-xl bg-[#111C30]/60 hover:bg-[#16233D] border border-white/[0.06] hover:border-indigo-500/30 flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">Get Help</p>
                <p className="text-[10px] text-slate-400">Support and guides</p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DatasetOverviewPanel;
