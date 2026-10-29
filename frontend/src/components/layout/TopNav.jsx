import React, { useState } from 'react';
import { Search, Sparkles, Bell, ChevronDown, Menu, User, Settings, LogOut, Check } from 'lucide-react';

const TopNav = ({
  onGlobalSearch,
  onOpenMobileMenu,
  activeDataset = null,
  onOpenUpgrade
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      onGlobalSearch?.(searchTerm.trim());
      setSearchTerm('');
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 glass-nav border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* Mobile drawer toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Natural-Language Query Search Input */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeDataset
                ? `Ask anything about ${activeDataset.filename || 'your data'}... (e.g. 'Show top 5 by revenue')`
                : "Ask anything about your data... (e.g. 'Show top 5 products by revenue')"
            }
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium outline-none transition-all shadow-2xs"
          />

          <button
            type="button"
            onClick={() => {
              if (searchTerm.trim()) {
                onGlobalSearch?.(searchTerm.trim());
                setSearchTerm('');
              }
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
            title="Execute AI Query"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-3 sm:gap-4 ml-4 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                  <p className="font-semibold text-slate-800">DuckDB Engine Ready</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">In-memory column engine initialized with zero query latency.</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800">Dataset Active</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeDataset?.filename || 'Sales data'} schema profiled successfully.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200 cursor-pointer hover:opacity-90 transition-opacity select-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white">
              A
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">Aditya</p>
              <p className="text-[10px] text-slate-400 font-medium">Data Analyst</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-900">Aditya</p>
                <p className="text-[10px] text-slate-400">aditya@datamind.ai</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenUpgrade?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600 text-left transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenUpgrade?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-600 text-left transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Preferences</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  alert('Session active. Antigravity authenticated user.');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
