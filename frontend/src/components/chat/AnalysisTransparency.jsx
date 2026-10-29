import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, Code, Filter, Copy, Check } from 'lucide-react';

const AnalysisTransparency = ({ transparency }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!transparency) return null;

  const {
    operation,
    metric,
    column,
    filters = [],
    limit,
    engine = 'duckdb',
    rowCount,
    sql
  } = transparency;

  const handleCopySql = () => {
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors group"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            Execution Details:
          </span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-medium border border-indigo-200/50 dark:border-indigo-800/50">
            {engine === 'duckdb' ? 'DuckDB SQL' : 'JS Fallback'}
          </span>
          {operation && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
              {operation.toUpperCase()}{metric ? `(${metric})` : ''}
            </span>
          )}
          {filters && filters.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <Filter className="w-3 h-3" />
              {filters.length} filter{filters.length > 1 ? 's' : ''}
            </span>
          )}
          {rowCount !== undefined && rowCount !== null && (
            <span className="text-[11px] text-slate-400">
              • {rowCount} record{rowCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 ml-2">
          <span className="text-[11px]">{isOpen ? 'Hide' : 'Inspect'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Operation:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                {operation || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Metric:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                {metric || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Dimension:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                {column || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Limit:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                {limit ?? 'All'}
              </span>
            </div>
          </div>

          {filters && filters.length > 0 && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 block mb-1">Applied Filters:</span>
              <div className="flex flex-wrap gap-1.5">
                {filters.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-mono text-[11px]"
                  >
                    {f.field} {f.operator} "{f.value}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {sql && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Code className="w-3 h-3 text-indigo-500" />
                  Generated DuckDB Query:
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy SQL
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-900 text-indigo-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                {sql}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisTransparency;

