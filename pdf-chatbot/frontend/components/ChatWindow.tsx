'use client';

import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import SourceCard from './SourceCard';
import SearchFilters from './SearchFilters';
import { chatAPI, ChatResponse } from '@/lib/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: ChatResponse['sources'];
  format?: 'text' | 'table';
  tableData?: any[];
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        query: input,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isUser: false,
        timestamp: new Date(),
        sources: response.sources,
        format: response.format || 'text',
        tableData: response.table_data || undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          showFilters ? 'w-80' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-navy-900 border-r border-cyan-500/20`}
      >
        <div className="p-4">
          <SearchFilters filters={filters} onFilterChange={setFilters} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-navy-800 border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Mosdorfer Catalogue Assistant</h1>
              <p className="text-sm text-gray-400">Engineering Product Catalogue</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-cyan-400 rounded transition-colors"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-cyan-400 rounded transition-colors"
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🔧</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome to Mosdorfer Catalogue Assistant
                </h2>
                <p className="text-gray-400 mb-6">
                  Ask me anything about products, specifications, or part numbers
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <button
                    onClick={() => setInput('What is the weight of PK 20/II clamp?')}
                    className="bg-navy-700 hover:bg-navy-600 text-left p-3 rounded border border-cyan-500/20 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="text-cyan-400 text-sm mb-1">Example Query</div>
                    <div className="text-white text-sm">What is the weight of PK 20/II clamp?</div>
                  </button>
                  <button
                    onClick={() => setInput('Show all suspension clamps')}
                    className="bg-navy-700 hover:bg-navy-600 text-left p-3 rounded border border-cyan-500/20 hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="text-cyan-400 text-sm mb-1">Example Query</div>
                    <div className="text-white text-sm">Show all suspension clamps</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              <MessageBubble
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
                format={message.format}
                tableData={message.tableData}
              />
              {!message.isUser && message.sources && message.sources.length > 0 && (
                <div className="ml-4 mb-6 space-y-2">
                  <div className="text-sm text-gray-400 mb-2">Sources:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {message.sources.map((source, idx) => (
                      <SourceCard key={idx} source={source} index={idx} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-navy-700 rounded-lg px-4 py-3 border border-cyan-500/20">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-navy-800 border-t border-cyan-500/20 px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about products, specifications, or part numbers..."
              className="flex-1 bg-navy-700 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              Send
            </button>
          </div>
          {Object.keys(filters).length > 0 && (
            <div className="mt-2 text-sm text-cyan-400">
              Active filters: {Object.keys(filters).length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
