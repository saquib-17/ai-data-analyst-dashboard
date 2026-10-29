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
  ArrowRight
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

  if (!dataset) {
    return (
      <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
        <div className="saas-card p-5 text-center bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Quick Start</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Upload a CSV to view schema statistics, quality metrics, and start conversational exploration.
          </p>
          <button
            type="button"
            onClick={onUploadClick}
            className="w-full btn-gradient py-2 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-semibold">Upload CSV Dataset</span>
          </button>
        </div>
      </aside>
    );
  }

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
        return <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center">#</span>;
      case 'date':
        return <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 font-bold text-[10px] flex items-center justify-center">📅</span>;
      case 'boolean':
        return <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-600 font-bold text-[10px] flex items-center justify-center">✓</span>;
      default:
        return <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">Aa</span>;
    }
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
      {/* 1. Dataset Overview Card */}
      <div className="saas-card p-4 bg-white border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800">Dataset Overview</h3>
          <button
            type="button"
            onClick={onViewSchema}
            className="text-[11px] font-semibold text-indigo-600 hover:text-purple-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-base font-extrabold text-slate-900 tracking-tight">
              {rowCount > 1000 ? `${(rowCount / 1000).toFixed(1)}K` : rowCount}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Total Rows</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-base font-extrabold text-slate-900 tracking-tight">{columnCount}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Columns</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-base font-extrabold text-slate-900 tracking-tight">
              {rowCount ? `${(rowCount * 0.12).toFixed(1)}K` : '2.4 MB'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Est. Size</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-800">
              {uploadedAt ? new Date(uploadedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2024'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Date Span</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600">{completeness}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Data Quality</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-800">CSV</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">File Format</p>
          </div>
        </div>
      </div>

      {/* 2. Schema Preview Card */}
      <div className="saas-card p-4 bg-white border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800">Schema Preview</h3>
          <button
            type="button"
            onClick={onViewSchema}
            className="text-[11px] font-semibold text-indigo-600 hover:text-purple-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Full Schema</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5">
          {displayColumns.map((col) => {
            const info = schema[col] || {};
            const type = info.type || 'string';
            return (
              <div
                key={col}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {getTypeIcon(type)}
                  <span className="font-semibold text-slate-700 truncate">{col}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 capitalize">{type}</span>
              </div>
            );
          })}
        </div>

        {columns.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="w-full mt-2 pt-2 border-t border-slate-100 text-center text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{showAllColumns ? 'Show fewer' : `Show more columns (${columns.length - 8})`}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllColumns ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* 3. Quick Actions Card */}
      <div className="saas-card p-4 bg-white border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 mb-3">Quick Actions</h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onUploadClick}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-left transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight">Upload Dataset</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Supports CSV</p>
          </button>

          <button
            type="button"
            onClick={onViewInsights}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 text-left transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight">View Insights</p>
            <p className="text-[10px] text-slate-500 mt-0.5">AI-powered analytics</p>
          </button>

          <button
            type="button"
            onClick={onManageConversations}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-left transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight">Conversations</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Saved threads</p>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-left transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Download className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight">Export Results</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Download CSV</p>
          </button>
        </div>
      </div>

      {/* 4. Recent Datasets Card */}
      {datasets.length > 0 && (
        <div className="saas-card p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800">Recent Datasets</h3>
            <span className="text-[10px] text-slate-500">{datasets.length} total</span>
          </div>

          <div className="space-y-1.5">
            {datasets.slice(0, 4).map((d) => {
              const isCurrent = dataset && d.id === dataset.id;
              return (
                <div
                  key={d.id}
                  onClick={() => onSelectDataset?.(d.id)}
                  className={`p-2 rounded-xl border cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-indigo-50/50 border-indigo-300 shadow-2xs'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                      {d.filename}
                    </p>
                    {isCurrent ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {d.rowCount} rows
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

export default DatasetOverviewPanel;
