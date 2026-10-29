import React, { useState } from 'react';
import { Eye, Search, Download, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const PreviewView = ({ dataset, onBackToChat, onExportCsv }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  if (!dataset) {
    return (
      <div className="saas-card p-12 text-center text-xs text-slate-400 bg-[#0E1628] border border-white/10">
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F1F5F9] tracking-tight">
            Data Records Preview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Displaying sample preview records from <span className="font-bold text-slate-200">{dataset.filename}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111C30] hover:bg-[#16233D] border border-white/10 text-xs font-semibold text-slate-200 transition-colors shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-gradient text-white text-xs font-semibold transition-colors shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="saas-card p-5 bg-[#0E1628] border border-white/10">
        {/* Search Bar & Stats */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              placeholder="Search in preview rows..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-[#F1F5F9] placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing {filteredData.length} records • Total {dataset.rowCount?.toLocaleString()} in database
          </div>
        </div>

        {/* Scrollable Data Table */}
        {pageRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No matching records found in preview.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#111C30]/90 backdrop-blur-md text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-2.5 px-3 text-slate-500">#</th>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {pageRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                      {page * pageSize + idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-300 font-mono text-[11px]">
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
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/[0.08] text-xs">
          <span className="text-slate-400">
            Page {page + 1} of {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
