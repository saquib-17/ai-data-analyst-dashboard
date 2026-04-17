import React from 'react';
import { Search, Loader2, Sparkles, Command } from 'lucide-react';

const QueryPanel = ({ query, setQuery, handleAnalyze, loading, error }) => {
  return (
    <div className="relative w-full max-w-4xl mx-auto -mt-6 z-20 group">
      
      {/* Glow effect behind the input */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur-xl opacity-20 dark:opacity-30 group-hover:opacity-40 transitionduration-500"></div>

      <div className="relative bg-white/90 dark:bg-[#1E2536]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.4)] border border-slate-100 dark:border-white/10 p-2 md:p-3 flex items-center transition-all duration-300 group-focus-within:border-indigo-400 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 dark:group-focus-within:ring-indigo-400/10 group-focus-within:bg-white dark:group-focus-within:bg-[#1E2536]">
        
        <div className="flex items-center justify-center pl-4 pr-2">
            <Command className="w-5 h-5 text-indigo-500/50 dark:text-purple-400/50" />
        </div>

        <form onSubmit={handleAnalyze} className="flex-1 flex items-center">
            
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your data... (e.g. 'Show me the top 5 sales')"
              className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-lg sm:text-xl py-3 px-2 font-medium"
              disabled={loading}
              autoComplete="off"
            />
            
            <button
                type="submit"
                disabled={loading || !query.trim()}
                className="ml-2 flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full h-12 w-12 sm:w-auto sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 flex-shrink-0"
            >
              {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                  <>
                    <Search className="w-5 h-5 sm:hidden" />
                    <span className="hidden sm:flex items-center gap-2 font-bold tracking-wide">
                        <Sparkles className="w-4 h-4" /> Analyze
                    </span>
                  </>
              )}
            </button>
        </form>
      </div>
      
      {/* Error state floating below */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 px-6 py-3 bg-red-500 text-white text-sm font-semibold rounded-2xl shadow-lg border border-red-400 flex items-center gap-2 animate-in slide-in-from-top-2">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default QueryPanel;
