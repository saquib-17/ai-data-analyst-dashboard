import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  MoreVertical,
  Download,
  Trash2,
  UploadCloud,
  Layers,
  Sparkles,
  Eye,
  Table,
  MessageSquare
} from 'lucide-react';

const DatasetContextBar = ({
  dataset,
  activeTab = 'chat',
  setActiveTab,
  onUploadClick,
  onDeleteDataset,
  onExportCsv
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'schema', label: 'Schema', icon: Table },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'insights', label: 'Insights', icon: Sparkles }
  ];

  if (!dataset) {
    return (
      <div className="px-4 sm:px-6 py-2.5 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">No active dataset</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Upload a CSV file or select a dataset to start conversational analysis
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUploadClick}
          className="btn-gradient px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </button>
      </div>
    );
  }

  const { filename, rowCount = 0, columnCount = 0, uploadedAt } = dataset;

  const formatUploadTime = (iso) => {
    if (!iso) return 'Recently';
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const fileSizeStr = dataset.fileSize || (dataset.fileSizeBytes ? `${(dataset.fileSizeBytes / 1024).toFixed(1)} KB` : '1.0 KB');
  const uploadTimeStr = formatUploadTime(uploadedAt);

  return (
    <div className="px-3 sm:px-6 py-2 sm:py-2.5 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 relative z-20">
      {/* Left: Dataset File Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 shadow-xs">
          <FileSpreadsheet className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-md">
              {filename || 'dataset.csv'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          </div>

          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[260px] sm:max-w-none">
            {rowCount.toLocaleString()} rows • {columnCount} columns • {fileSizeStr} • Uploaded {uploadTimeStr}
          </p>
        </div>
      </div>

      {/* Right: Context Tabs + Options */}
      <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
        {/* Segmented Pill Tabs Container */}
        <div className="flex items-center p-1 bg-[#0B1220] rounded-xl border border-white/[0.08] overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'tab-pill-active'
                    : 'tab-pill-inactive'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* More Actions Dropdown Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-xl bg-[#0B1220] border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Dataset actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0E1628] rounded-xl shadow-2xl border border-white/10 p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExportCsv?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.05] text-left transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export CSV Data</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm(`Are you sure you want to delete ${filename}? This will remove it from disk and persistent database.`)) {
                    onDeleteDataset?.(dataset.id);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Dataset</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasetContextBar;
