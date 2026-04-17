import React from 'react';
import { Sun, Moon, Sparkles, FolderUp, Activity, Box } from 'lucide-react';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  return (
    <div className="w-full pt-6 px-4 md:px-1 flex justify-center sticky top-0 z-50">
      <nav className="w-full max-w-4xl bg-white/70 dark:bg-[#1E2536]/70 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] px-4 py-2 flex items-center justify-between transition-all duration-300">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center shadow-inner">
             <Sparkles className="w-5 h-5 text-white dark:text-slate-900" strokeWidth={2} />
          </div>
          <span className="text-base font-bold text-slate-800 dark:text-slate-100 hidden sm:block tracking-wide">AI<span className="font-light text-slate-500">Analytics</span></span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#2A3143] flex items-center justify-center border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400 focus:outline-none active:scale-95"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
