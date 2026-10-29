import React, { useState } from 'react';
import { Eye, Search, Download, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const PreviewView = ({ dataset, onBackToChat, onExportCsv }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  if (!dataset) {
    return (
      <div className="saas-card p-12 text-center text-xs text-slate-400">
        No dataset selected. Please upload or select a dataset to preview its records.
      </div>
    );
  }

  const rawData = Array.isArray(dataset.data) ? dataset.data : [];
  const columns = dataset.columns || (rawData.length > 0 ? Object.keys(rawData[0]) : []);

  const filteredData = rawData.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(
      (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const pageRows = filteredData.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header and Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Data Records Preview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Displaying sample preview records from <span className="font-bold text-slate-800">{dataset.filename}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-brand-indigo" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-indigo text-white text-xs font-semibold hover:bg-brand-indigo/90 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="saas-card p-5">
        {/* Search Bar & Stats */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              placeholder="Search in preview rows..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:bg-white focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/10 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredData.length} records • Total {dataset.rowCount?.toLocaleString()} in database
          </div>
        </div>

        {/* Scrollable Data Table */}
        {pageRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-workspace-muted">
            No matching records found in preview.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-slate-400">#</th>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {page * pageSize + idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                        {row[col] !== undefined && row[col] !== null ? String(row[col]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Page {page + 1} of {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewView;

