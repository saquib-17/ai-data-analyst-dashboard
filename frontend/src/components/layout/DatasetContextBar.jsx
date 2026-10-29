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
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200/90 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">No active dataset</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Upload a CSV file or select a dataset to start conversational analysis
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUploadClick}
          className="btn-gradient px-3.5 py-1.5 text-xs flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </button>
      </div>
    );
  }

  const { filename, rowCount = 0, columnCount = 0, uploadedAt } = dataset;
  const timeAgo = uploadedAt ? new Date(uploadedAt).toLocaleDateString() : 'Recently';

  return (
    <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs relative">
      {/* Left: Dataset File Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
          <FileSpreadsheet className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md">
              {filename || 'dataset.csv'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          </div>

          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {rowCount.toLocaleString()} rows • {columnCount} columns • Uploaded {timeAgo}
          </p>
        </div>
      </div>

      {/* Right: Context Tabs + Options */}
      <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto max-w-full">
        {/* Segmented Pill Tabs Container */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
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
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Dataset actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onExportCsv?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 text-left transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export Dataset (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (dataset?.id) onDeleteDataset?.(dataset.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
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
