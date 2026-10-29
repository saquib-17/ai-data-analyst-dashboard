import React, { useState } from 'react';
import { MessageSquare, Plus, Search, Clock, Trash2, Edit2, Check, ArrowRight, Database } from 'lucide-react';

const ConversationsView = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startRename = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
  };

  const saveRename = (convId) => {
    if (editTitle.trim()) {
      onRenameConversation?.(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#F1F5F9] tracking-tight">
            Saved Conversations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Access your multi-turn analytical chat history stored in SQLite persistence.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewConversation}
          className="btn-gradient px-4 py-2 text-xs flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white font-semibold">New Conversation</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="saas-card p-5 bg-[#0E1628] border border-white/10">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0B1220] border border-white/10 text-xs text-[#F1F5F9] placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {filtered.length} conversation{filtered.length === 1 ? '' : 's'} found
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No saved conversations found. Click "New Conversation" to begin.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((c) => {
              const isEditing = editingId === c.id;
              const isActive = activeConversationId === c.id;

              return (
                <div
                  key={c.id}
                  className={`py-3.5 px-3 rounded-xl flex items-center justify-between hover:bg-white/[0.03] transition-colors ${
                    isActive ? 'bg-indigo-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveRename(c.id)}
                            autoFocus
                            className="text-xs font-bold text-white bg-[#0B1220] border border-indigo-500/50 rounded-lg px-2.5 py-1 outline-none w-full max-w-sm"
                          />
                          <button
                            type="button"
                            onClick={() => saveRename(c.id)}
                            className="p-1.5 rounded-lg btn-gradient text-white cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p
                          onClick={() => onSelectConversation(c.id)}
                          className="text-xs font-bold text-[#F1F5F9] truncate cursor-pointer hover:text-indigo-400 transition-colors"
                        >
                          {c.title || 'Untitled Thread'}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{c.messageCount || 0} messages</span>
                        {c.datasetId && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-300 font-medium">
                              <Database className="w-2.5 h-2.5 text-cyan-400" /> Linked Dataset
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectConversation(c.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#111C30] hover:bg-indigo-600 text-indigo-400 hover:text-white border border-white/5 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => startRename(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Rename thread"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteConversation(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsView;
