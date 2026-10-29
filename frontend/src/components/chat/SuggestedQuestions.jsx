import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const SuggestedQuestions = ({ suggestions = [], onSelect, disabled = false }) => {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;

  return (
    <div className="w-full mt-3 pt-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Suggested follow-up questions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(q)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200/80 hover:border-indigo-200 dark:border-slate-700/60 dark:hover:border-indigo-800/50 transition-all text-left shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
          >
            <span>{q}</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;

