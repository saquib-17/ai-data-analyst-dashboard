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
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Saved Conversations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Access your multi-turn analytical chat history stored in SQLite persistence.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewConversation}
          className="btn-gradient px-4 py-2 text-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="saas-card p-5">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:bg-white focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/10 transition-all"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} conversation{filtered.length === 1 ? '' : 's'} found
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No saved conversations found. Click "New Conversation" to begin.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => {
              const isEditing = editingId === c.id;
              const isActive = activeConversationId === c.id;

              return (
                <div
                  key={c.id}
                  className={`py-3.5 px-3 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isActive ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-brand-purple flex items-center justify-center flex-shrink-0">
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
                            className="text-xs font-bold text-slate-800 bg-white border border-brand-indigo rounded-lg px-2 py-1 outline-none w-full max-w-sm"
                          />
                          <button
                            type="button"
                            onClick={() => saveRename(c.id)}
                            className="p-1 rounded-md bg-brand-indigo text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p
                          onClick={() => onSelectConversation(c.id)}
                          className="text-xs font-bold text-slate-800 truncate cursor-pointer hover:text-brand-indigo transition-colors"
                        >
                          {c.title || 'Untitled Thread'}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{c.messageCount || 0} messages</span>
                        {c.datasetId && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              <Database className="w-2.5 h-2.5 text-brand-blue" /> Linked Dataset
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
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-brand-indigo text-brand-indigo hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => startRename(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Rename thread"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteConversation(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

