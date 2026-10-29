import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Database,
  Sparkles,
  FileText,
  BarChart3,
  BarChart2,
  Table2,
  Plus,
  Crown,
  Settings,
  HelpCircle,
  Clock,
  ChevronDown,
  X,
  Trash2,
  ChevronRight,
  Bot,
  PieChart
} from 'lucide-react';

const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Sidebar = ({
  currentView,
  setCurrentView,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  mobileOpen = false,
  setMobileOpen,
  onOpenUpgrade,
  onOpenSettings,
  onOpenHelp
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Copilot', icon: Bot },
    { id: 'charts', label: 'Chart Studio', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'explorer', label: 'Data Explorer', icon: Table2 },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'analytics-hub', label: 'Analytics Hub', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (viewId) => {
    if (viewId === 'settings') {
      onOpenSettings?.();
      return;
    }
    if (viewId === 'charts' || viewId === 'explorer') {
      setCurrentView(viewId === 'charts' ? 'chat' : 'schema');
    } else {
      setCurrentView(viewId);
    }
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleConversationClick = (convId) => {
    onSelectConversation?.(convId);
    setCurrentView('chat');
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1220] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Section */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 4 Glowing Gradient Bars Logo */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center gap-0.5 p-1.5 shadow-[0_0_20px_rgba(91,92,240,0.35)]">
                <span className="w-1 h-3 rounded-full bg-gradient-to-t from-cyan-400 to-blue-500" />
                <span className="w-1 h-5 rounded-full bg-gradient-to-t from-blue-500 to-indigo-500" />
                <span className="w-1 h-6 rounded-full bg-gradient-to-t from-indigo-500 to-purple-500" />
                <span className="w-1 h-4 rounded-full bg-gradient-to-t from-purple-500 to-pink-500" />
              </div>

              <div>
                <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  DataMind AI
                </h1>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                  Your Personal Data Analyst
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Conversation Button */}
          <button
            type="button"
            onClick={() => {
              onNewConversation?.();
              if (setMobileOpen) setMobileOpen(false);
            }}
            className="w-full mt-4 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-indigo-600/40 hover:from-indigo-600/60 hover:to-purple-600/50 border border-indigo-400/40 text-white text-xs font-semibold shadow-[0_0_20px_rgba(91,92,240,0.25)] transition-all cursor-pointer group active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Conversation</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-slate-300 rounded border border-white/10">
              ⌘ N
            </kbd>
          </button>
        </div>

        {/* Scrollable Middle: Navigation + Recent Conversations */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-2 space-y-4 relative">
          {/* Subtle Aurora Ambient Glow */}
          <div className="absolute bottom-4 left-0 right-0 h-40 bg-gradient-to-tr from-cyan-500/10 via-indigo-500/15 to-purple-600/15 blur-2xl pointer-events-none" />

          {/* Primary Navigation Links */}
          <nav className="space-y-1 relative z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'dashboard' && currentView === 'chat');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1E293B]/80 text-white font-semibold shadow-xs border border-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Recent Conversations List */}
          <div className="relative z-10 pt-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Recent Conversations
              </span>
              <button
                type="button"
                onClick={onNewConversation}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Start new conversation"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {conversations.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-slate-400 bg-white/5 rounded-xl border border-white/5">
                No recent conversations
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.slice(0, 5).map((c) => {
                  const isCurrent = c.id === activeConversationId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleConversationClick(c.id)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#1E293B]/90 text-white font-semibold border border-indigo-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className="truncate text-xs">{c.title || 'Untitled Thread'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-slate-400 group-hover:hidden">
                          {formatRelativeTime(c.updatedAt)}
                        </span>
                        {onDeleteConversation && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(c.id);
                            }}
                            className="hidden group-hover:flex p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete thread"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {conversations.length > 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('conversations');
                      if (setMobileOpen) setMobileOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <span>Show more</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Pro Upgrade Card & Settings */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* Upgrade to Pro Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#162138] to-[#111B2E] border border-white/10 shadow-lg relative overflow-hidden">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-500/30 shadow-xs">
                <Crown className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white tracking-tight">Pro Plan</p>
                <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                  Unlock advanced analytics, larger file uploads, and more.
                </p>
              </div>
            </div>

            {/* Storage Progress Bar (Matches Mockup '2.4 GB / 10 GB') */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-mono">
                <span>Storage</span>
                <span className="text-slate-300 font-semibold">2.4 GB / 10 GB</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500"
                  style={{ width: '24%' }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenUpgrade}
              className="w-full mt-3 py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[11px] font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <span>Upgrade Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Footer Utility Actions */}
          <div className="space-y-0.5 pt-1">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onOpenHelp}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Help &amp; Support</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
