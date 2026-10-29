import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Paperclip, BarChart2, TrendingUp, Lightbulb, Loader2 } from 'lucide-react';

const ChatComposer = ({
  onSend,
  loading = false,
  disabled = false,
  placeholder = "Ask a follow-up question about your data..."
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || loading || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePillClick = (mode) => {
    if (disabled || loading) return;
    const prefixes = {
      analyze: 'Analyze performance and breakdown of ',
      visualize: 'Show a visual trend chart for ',
      suggest: 'Suggest top actionable insights for '
    };
    setInput((prev) => (prev ? `${prev} ` : prefixes[mode] || ''));
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-lg p-2.5 sm:p-3 transition-all focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Attachment Paperclip Button */}
        <button
          type="button"
          onClick={() => alert('Dataset attachment active. Using current active CSV dataset in DuckDB memory.')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
          title="Attached dataset active"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Query Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder={disabled ? "Select or upload a dataset to begin..." : placeholder}
          className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium py-1 disabled:opacity-50"
        />

        {/* Quick Action Mode Pills (Analyze, Visualize, Suggest) */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => handlePillClick('analyze')}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            <BarChart2 className="w-3 h-3 text-indigo-500" />
            <span>Analyze</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillClick('visualize')}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-200 text-[11px] font-semibold text-slate-600 hover:text-purple-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            <TrendingUp className="w-3 h-3 text-purple-500" />
            <span>Visualize</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillClick('suggest')}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-200 text-[11px] font-semibold text-slate-600 hover:text-amber-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Suggest</span>
          </button>
        </div>

        {/* Purple Gradient Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || loading || disabled}
          className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer transition-all active:scale-95"
          title="Send query"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatComposer;
