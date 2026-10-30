import React, { useState, useRef } from 'react';
import { Send, Paperclip, BarChart2, TrendingUp, Lightbulb, Loader2 } from 'lucide-react';

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
      className="w-full bg-[#0E1628] rounded-2xl border border-white/[0.08] shadow-2xl p-2.5 sm:p-3 transition-all focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Attachment Paperclip Button */}
        <button
          type="button"
          onClick={() => {
            inputRef.current?.focus();
          }}
          className="p-2 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
          title="Active dataset attached in DuckDB memory"
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
          placeholder={disabled ? "Please connect a dataset above to ask questions..." : placeholder}
          className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-[#F1F5F9] placeholder:text-slate-500 font-medium py-1 disabled:opacity-40"
        />

        {/* Quick Action Mode Pills (Analyze, Visualize, Suggest) */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => handlePillClick('analyze')}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111C30] hover:bg-[#16233D] border border-white/10 hover:border-indigo-500/40 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          >
            <BarChart2 className="w-3 h-3 text-indigo-400" />
            <span>Analyze</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillClick('visualize')}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111C30] hover:bg-[#16233D] border border-white/10 hover:border-purple-500/40 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          >
            <TrendingUp className="w-3 h-3 text-purple-400" />
            <span>Visualize</span>
          </button>

          <button
            type="button"
            onClick={() => handlePillClick('suggest')}
            disabled={disabled || loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111C30] hover:bg-[#16233D] border border-white/10 hover:border-amber-500/40 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Suggest</span>
          </button>
        </div>

        {/* Purple Gradient Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || loading || disabled}
          className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.35)] cursor-pointer transition-all active:scale-95"
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
