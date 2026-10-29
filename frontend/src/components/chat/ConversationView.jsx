import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, Plus, RefreshCw, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatComposer from './ChatComposer';
import { getApiUrl } from '../../utils/api';

const DEFAULT_STARTERS = [
  "Show me the top 5 products by revenue and also show their monthly trend",
  "What is the total revenue and average order value?",
  "Break down records by region and calculate total sales",
  "What are the highest and lowest performing categories?"
];

const ConversationView = ({
  datasetId,
  activeDataset,
  activeConversationId,
  onConversationChange,
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

  // Sync internal conversationId with prop
  useEffect(() => {
    if (activeConversationId !== conversationId) {
      setConversationId(activeConversationId);
      if (activeConversationId) {
        loadConversation(activeConversationId);
      } else {
        setMessages([]);
        setPreviousOperation(null);
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

  // Load an existing saved conversation thread from SQLite
  const loadConversation = async (idToLoad) => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl(`/api/conversations/${idToLoad}`));
      if (!res.ok) throw new Error("Could not load conversation.");

      const conv = await res.json();
      setConversationId(conv.id);

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
      console.error("Error loading conversation:", err);
      setSessionError("Failed to load saved conversation.");
    } finally {
      setLoading(false);
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

  if (!datasetId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Ready for Conversational Analysis
        </h3>
        <p className="text-slate-500 max-w-md text-sm leading-relaxed mb-6 font-medium">
          Select or upload a CSV dataset to ask natural-language questions, explore trends, and generate verified DuckDB visualizations.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-indigo-600 flex items-center justify-center mb-3 border border-purple-100">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">
              Ask anything about {activeDataset?.filename || 'your dataset'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed font-medium">
              DuckDB executes verified SQL queries over your records. Select a question starter below to begin:
            </p>

            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {DEFAULT_STARTERS.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(starter)}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-2xs hover:shadow-xs transition-all hover:scale-[1.01] cursor-pointer flex items-center gap-2"
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
            <div className="w-8 h-8 rounded-full bg-[#0B1220] border border-purple-500/40 text-purple-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200/90 rounded-2xl px-5 py-4 shadow-card">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>Analyzing dataset with DuckDB...</span>
                <span className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Docked Bottom Chat Composer */}
      <div className="p-4 sm:p-5 bg-[#F5F7FC] border-t border-slate-200/80 sticky bottom-0 z-10">
        <ChatComposer
          onSend={handleSendMessage}
          loading={loading}
          disabled={!datasetId}
        />
      </div>
    </div>
  );
};

export default ConversationView;
