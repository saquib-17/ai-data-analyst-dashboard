import React, { useState } from 'react';
import { Search, Sparkles, Bell, ChevronDown, Menu, User, Settings, LogOut, Check } from 'lucide-react';

const TopNav = ({
  onGlobalSearch,
  onOpenMobileMenu,
  activeDataset = null,
  onOpenUpgrade,
  onOpenSettings,
  systemStatus = null,
  user = { name: 'Aditya', email: 'aditya@datamind.ai', role: 'Data Analyst', initials: 'A' }
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
    <header className="h-16 px-2.5 sm:px-6 bg-[#0A0F1D]/80 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 max-w-2xl">
        {/* Mobile drawer toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Natural-Language Query Search Input */}
        <div className="relative flex-1 min-w-0 group">
          <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeDataset
                ? `Ask about ${activeDataset.filename || 'dataset'}...`
                : "Ask anything about your data..."
            }
            className="w-full min-w-0 pl-8 pr-8 sm:pl-10 sm:pr-20 py-2 rounded-xl bg-[#0B1220] hover:bg-[#0E1628] focus:bg-[#0E1628] border border-white/[0.08] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm text-[#F1F5F9] placeholder:text-[#64748B] font-medium outline-none transition-all shadow-inner truncate"
          />

          <div className="absolute inset-y-0 right-0 pr-1.5 sm:pr-2.5 flex items-center gap-1.5">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/[0.06] text-slate-400 rounded border border-white/10 select-none">
              Ctrl K
            </kbd>
            <button
              type="button"
              onClick={() => {
                if (searchTerm.trim()) {
                  onGlobalSearch?.(searchTerm.trim());
                  setSearchTerm('');
                }
              }}
              className="p-1 rounded text-purple-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Execute AI Query"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-1.5 sm:gap-4 ml-1.5 sm:ml-4 relative flex-shrink-0">
        {/* Engine Status Pill (Matches Reference Images 1 & 2) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E1628] border border-white/[0.08] text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          <span>{activeDataset ? 'DuckDB • In-Memory' : 'DuckDB • Ready'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0A0F1D] animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-[#0E1628] rounded-2xl shadow-2xl border border-white/10 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-white">Notifications</span>
                <span className="text-[10px] text-indigo-400 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="font-semibold text-white">DuckDB Engine Ready</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">In-memory columnar engine initialized with 100% deterministic arithmetic.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="font-semibold text-white">{activeDataset ? 'Dataset Connected' : 'System Ready'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeDataset ? `${activeDataset.filename} profiled with SQLite ACID persistence.` : 'Upload a CSV to start analyzing.'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="relative">
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-white/[0.08] cursor-pointer hover:opacity-90 transition-opacity select-none"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-white/10 flex-shrink-0">
              {user.initials || user.name?.[0] || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{user.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-1.5rem)] bg-[#0E1628] rounded-2xl shadow-2xl border border-white/10 p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                <p className="font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenUpgrade?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white text-left transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Account Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenSettings?.();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white text-left transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preferences & Settings</span>
              </button>

              <div className="border-t border-white/[0.06] my-1" />

              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Session Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
