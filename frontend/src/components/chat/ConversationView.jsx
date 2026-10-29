import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  Database,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatComposer from './ChatComposer';
import { getApiUrl } from '../../utils/api';

const getDatasetStarters = (dataset) => {
  if (!dataset || !dataset.columns || dataset.columns.length === 0) {
    return [
      "Show me the top 5 records by value",
      "What is the total sum and average?",
      "Break down records by category",
      "Show highest and lowest performing items"
    ];
  }

  const cols = dataset.columns;
  const numCol = cols.find(c => /revenue|sales|profit|spend|budget|amount|cost|price|total/i.test(c)) || cols.find(c => dataset.schema?.[c]?.type === 'numeric');
  const catCol = cols.find(c => /product|customer|campaign|category|segment|region|country|channel/i.test(c)) || cols.find(c => dataset.schema?.[c]?.type === 'string');

  const starters = [];
  if (catCol && numCol) {
    starters.push(`Show top 5 ${catCol} by ${numCol}`);
  }
  if (numCol) {
    starters.push(`What is the total ${numCol} and average ${numCol}?`);
  }
  if (catCol && numCol) {
    starters.push(`Break down ${numCol} by ${catCol}`);
  }
  const secondNum = cols.filter(c => c !== numCol).find(c => /profit|margin|orders|quantity|roi|clicks|conversion/i.test(c) || dataset.schema?.[c]?.type === 'numeric');
  if (secondNum && catCol) {
    starters.push(`Compare ${secondNum} across ${catCol}`);
  } else {
    starters.push(`Show summary statistics for ${dataset.filename || 'dataset'}`);
  }

  return starters.slice(0, 4);
};

const ConversationView = ({
  datasetId,
  activeDataset,
  datasets = [],
  activeConversationId,
  onConversationChange,
  onDatasetChange,
  onAttachDataset,
  onUploadClick,
  onNewConversation,
  searchTrigger = null,
  onClearSearchTrigger
}) => {
  const [conversationId, setConversationId] = useState(activeConversationId || null);
  const [messages, setMessages] = useState([]);
  const [previousOperation, setPreviousOperation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  const messagesEndRef = useRef(null);
  const loadSeqRef = useRef(0);

  // Sync internal conversationId with prop and fetch saved history
  useEffect(() => {
    if (activeConversationId !== conversationId) {
      setConversationId(activeConversationId);
      if (activeConversationId) {
        loadConversation(activeConversationId);
      } else {
        setMessages([]);
        setPreviousOperation(null);
        setSessionError(null);
        setLoading(false);
      }
    }
  }, [activeConversationId]);

  // Handle external search query triggered from TopNav
  useEffect(() => {
    if (searchTrigger && searchTrigger.trim() && datasetId && !loading) {
      handleSendMessage(searchTrigger.trim());
      onClearSearchTrigger?.();
    }
  }, [searchTrigger, datasetId]);

  // Auto-scroll on new message or loading state change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load an existing saved conversation thread from SQLite with stale response protection
  const loadConversation = async (idToLoad) => {
    const currentSeq = ++loadSeqRef.current;
    try {
      setLoading(true);
      setSessionError(null);
      // Immediately reset visible messages to prevent leakage from previous conversation
      setMessages([]);
      setPreviousOperation(null);

      const res = await fetch(getApiUrl(`/api/conversations/${idToLoad}`));
      if (!res.ok) throw new Error("Could not load conversation.");

      const conv = await res.json();

      // Guard: Discard stale response if user switched to another conversation in the meantime
      if (currentSeq !== loadSeqRef.current) return;

      setConversationId(conv.id);

      // Notify parent App of conversation's attached dataset (or null)
      onDatasetChange?.(conv.datasetId || null);

      const restoredMessages = (conv.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        chartConfig: m.chartConfig,
        result: m.chartConfig?.data || null,
        transparency: m.transparency,
        suggestedQuestions: m.suggestions || [],
        timestamp: new Date(m.createdAt).getTime()
      }));

      setMessages(restoredMessages);

      const lastAssistantMsg = [...conv.messages].reverse().find(m => m.role === 'assistant' && m.operation);
      if (lastAssistantMsg && lastAssistantMsg.operation) {
        setPreviousOperation(lastAssistantMsg.operation);
      } else {
        setPreviousOperation(null);
      }
    } catch (err) {
      if (currentSeq !== loadSeqRef.current) return;
      console.error("Error loading conversation:", err);
      setSessionError("Failed to load saved conversation.");
    } finally {
      if (currentSeq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async (queryText) => {
    if (!queryText || !datasetId || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: queryText,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setSessionError(null);

    // Provide context of recent 4 messages for multi-turn follow-ups
    const recentMessages = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.content
    }));

    const conversationContext = {
      previousOperation: previousOperation,
      recentMessages: recentMessages
    };

    try {
      const response = await fetch(getApiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          datasetId: datasetId,
          conversationId: conversationId,
          conversationContext: conversationContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete analytical query.');
      }

      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        if (onConversationChange) onConversationChange(data.conversationId);
      }

      if (data.queryInterpretation && data.queryInterpretation.operation) {
        setPreviousOperation(data.queryInterpretation);
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.insight || 'Query executed successfully.',
        chartConfig: data.chartConfig,
        result: data.result,
        transparency: data.transparency,
        suggestedQuestions: data.suggestedQuestions || [],
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Conversation query error:', err);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        isError: true,
        content: err.message || 'An unexpected error occurred while analyzing the dataset.',
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fresh Conversation Welcome State (No dataset associated)
  // Completely isolated from previous dataset, provides intuitive dataset selector
  if (!datasetId) {
    return (
      <div className="w-full flex-1 flex flex-col h-full overflow-hidden bg-[#06080F]">
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="max-w-2xl w-full text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/15 to-purple-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(99,102,241,0.25)] border border-indigo-500/30">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#F1F5F9] tracking-tight">
                Connect a Dataset to Begin
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 leading-relaxed max-w-lg mx-auto">
                This conversation is fresh and unattached. Select an existing registered dataset below or upload a new CSV to start asking natural-language questions.
              </p>
            </div>

            {/* Select an Existing Dataset */}
            {datasets && datasets.length > 0 && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Available Datasets ({datasets.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Click to attach to this conversation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {datasets.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => onAttachDataset?.(d.id)}
                      className="p-3.5 rounded-xl bg-[#0E1628] border border-white/[0.08] hover:border-indigo-500/50 hover:bg-[#111C30] transition-all cursor-pointer group flex items-start gap-3 shadow-md"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#F1F5F9] group-hover:text-indigo-400 truncate transition-colors">
                          {d.filename}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {(d.rowCount || 0).toLocaleString()} rows • {d.columnCount || 0} columns
                        </p>
                        <div className="mt-2 flex items-center text-[11px] font-bold text-indigo-400 group-hover:text-purple-400 gap-1">
                          <span>Connect to Chat</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload a New Dataset */}
            <div className="pt-2">
              <div className="p-5 rounded-2xl bg-[#0E1628] border border-dashed border-white/10 hover:border-indigo-500/50 transition-all text-center">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#F1F5F9]">
                  Want to analyze a different file?
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 mb-3">
                  Upload a CSV file (up to 2MB)
                </p>
                <button
                  type="button"
                  onClick={onUploadClick}
                  className="btn-gradient px-4 py-2 text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-white" />
                  <span className="text-white font-semibold">Upload New CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Disabled composer indicating dataset is required */}
        <div className="p-4 sm:p-5 bg-[#06080F]/90 backdrop-blur-md border-t border-white/[0.08] sticky bottom-0 z-10">
          <ChatComposer
            onSend={handleSendMessage}
            loading={false}
            disabled={true}
            placeholder="Please connect a dataset above to ask questions..."
          />
        </div>
      </div>
    );
  }

  // 2. Conversation Workspace (Dataset attached)
  const starters = getDatasetStarters(activeDataset);

  return (
    <div className="w-full flex-1 flex flex-col h-full relative overflow-hidden bg-[#06080F]">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,240,0.25)]">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-[#F1F5F9] mb-1">
              Ask anything about {activeDataset?.filename || 'your dataset'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed font-medium">
              DuckDB executes verified SQL queries over your records. Select a question starter below to begin:
            </p>

            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {starters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(starter)}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold bg-[#0E1628] text-slate-300 border border-white/10 hover:border-indigo-500/50 hover:text-white shadow-md hover:bg-[#111C30] transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-2"
                >
                  <span>{starter}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={msg.id || index}
              message={msg}
              onSelectSuggestion={(q) => handleSendMessage(q)}
              isBusy={loading}
            />
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3 w-full my-4 animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-[#0E1628] border border-purple-500/40 text-purple-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-3 bg-[#0E1628] border border-white/10 rounded-2xl px-5 py-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span>Analyzing dataset with DuckDB...</span>
                <span className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error notification if session failed */}
        {sessionError && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{sessionError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Docked Bottom Chat Composer */}
      <div className="p-4 sm:p-5 bg-[#06080F]/90 backdrop-blur-md border-t border-white/[0.08] sticky bottom-0 z-10">
        <ChatComposer
          onSend={handleSendMessage}
          loading={loading}
          disabled={!datasetId}
          placeholder={`Ask a question about ${activeDataset?.filename || 'your data'}...`}
        />
      </div>
    </div>
  );
};

export default ConversationView;
