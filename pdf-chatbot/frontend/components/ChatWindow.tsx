'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Mic, MicOff, Maximize2, Volume2, Globe, Send, SlidersHorizontal, Trash2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SourceCard from './SourceCard';
import SearchFilters from './SearchFilters';
import { chatAPI, ChatResponse } from '@/lib/api';

const Avatar = dynamic(() => import('./Avatar'), { ssr: false });

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
  const [showSources, setShowSources] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleRecording = () => setIsRecording(!isRecording);
  const toggleSpeaking = () => setIsSpeaking(!isSpeaking);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        query: text,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        show_sources: showSources,
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

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#f8f9fa] overflow-hidden">
      
      {/* LEFT PANEL: 3D Avatar (Cinematic Design) */}
      <div className="hidden lg:flex lg:w-[45%] h-full relative z-20 border-r border-[#e2e8f0] shadow-xl items-center justify-center bg-[#0a0c10]">
        
        {/* Floating Action Buttons */}
        <div className="absolute top-6 left-6 flex gap-3 z-30">
          <button className="p-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg">
            <Maximize2 size={18} />
          </button>
          <button 
            onClick={toggleSpeaking}
            className={`p-3 backdrop-blur-xl rounded-full border border-white/20 text-white hover:scale-105 transition-all shadow-lg ${isSpeaking ? 'bg-moss-blue/80' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <Volume2 size={18} />
          </button>
        </div>

        {/* The 3D Avatar Area */}
        <Avatar isSpeaking={isSpeaking || loading} />
        
        {/* Subtle branding overlay on avatar side */}
        <div className="absolute bottom-6 left-6 z-30 font-semibold text-white/50 tracking-wider text-xs flex items-center gap-2 drop-shadow-md">
          <img src="/logo.svg" alt="Mosdorfer Logo" className="h-6 opacity-80 mix-blend-screen grayscale" />
          <span>VIRTUAL ASSISTANT ENGINE</span>
        </div>
      </div>

      {/* RIGHT PANEL: Sleek Chat Interface */}
      <div className="flex-1 flex flex-row h-full w-full lg:w-[55%] relative z-10">
        
        {/* Hidden Sidebar (Filters) */}
        <div className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-[#e2e8f0] flex-shrink-0 z-30 shadow-lg`}>
          <div className="p-6 h-full overflow-y-auto">
            <SearchFilters 
              filters={filters} 
              showSources={showSources}
              onFilterChange={setFilters}
              onShowSourcesChange={setShowSources}
            />
          </div>
        </div>

        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative">
          
          {/* Extremely Minimal Header */}
          <div className="absolute top-0 w-full px-6 py-4 flex items-center justify-between z-20 bg-gradient-to-b from-[#f8f9fa] to-transparent pointer-events-none">
            <div className="font-bold text-moss-dark tracking-tight pointer-events-auto">Mosdorfer AI</div>
            <div className="flex gap-2 pointer-events-auto">
              <button onClick={() => setShowFilters(!showFilters)} className="p-2 text-gray-500 hover:text-moss-blue hover:bg-white rounded-full transition-colors shadow-sm bg-white/80 backdrop-blur-sm border border-gray-200">
                <SlidersHorizontal size={18} />
              </button>
              <button onClick={() => setMessages([])} className="p-2 text-gray-500 hover:text-moss-red hover:bg-white rounded-full transition-colors shadow-sm bg-white/80 backdrop-blur-sm border border-gray-200">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 pt-20 pb-40 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-moss-blue to-cyan-400 flex items-center justify-center shadow-lg shadow-moss-blue/20 mb-6 text-white text-3xl font-bold">M</div>
                <h2 className="text-3xl font-bold text-[#1f2937] mb-3 tracking-tight">How can I help you today?</h2>
                <p className="text-gray-500 mb-10 text-lg">Ask me anything about Mosdorfer products, specifications, or part numbers.</p>
                
                <div className="flex flex-col gap-3 w-full">
                  <button onClick={() => handleSend('What is the weight of PK 20/II clamp?')} className="bg-white hover:bg-blue-50 text-left p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md group">
                    <div className="text-moss-blue font-semibold text-xs uppercase tracking-wider mb-1">Specification Query</div>
                    <div className="text-moss-dark font-medium text-base">What is the weight of PK 20/II clamp?</div>
                  </button>
                  <button onClick={() => handleSend('Show all suspension clamps')} className="bg-white hover:bg-blue-50 text-left p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md group">
                    <div className="text-moss-blue font-semibold text-xs uppercase tracking-wider mb-1">Product Lookup</div>
                    <div className="text-moss-dark font-medium text-base">Show all suspension clamps</div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 w-full max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div key={message.id}>
                    <MessageBubble message={message.text} isUser={message.isUser} timestamp={message.timestamp} format={message.format} tableData={message.tableData} />
                    {!message.isUser && message.sources && message.sources.length > 0 && (
                      <div className="ml-4 mb-6 space-y-2 mt-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Citations:</div>
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
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-sm flex gap-2">
                      <div className="w-2.5 h-2.5 bg-moss-blue/60 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-moss-blue/80 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2.5 h-2.5 bg-moss-blue rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Floating Pill Input Container */}
          <div className="absolute bottom-0 w-full px-4 lg:px-8 pb-8 pt-10 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/90 to-transparent pointer-events-none flex flex-col items-center">
            
            <div className="w-full max-w-3xl flex bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 px-2 py-2 items-center pointer-events-auto backdrop-blur-lg">
              
              <button className="flex items-center gap-2 text-gray-400 hover:text-moss-blue transition-colors outline-none ml-4 mr-3 font-medium text-sm border-r border-gray-200 pr-4 shrink-0">
                <Globe size={18} />
                <span className="hidden sm:inline">English</span>
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent text-[#1f2937] placeholder-gray-400 focus:outline-none focus:ring-0 text-base py-3"
                disabled={loading}
              />
              
              <div className="flex items-center gap-1.5 ml-2 pr-2">
                <button onClick={toggleRecording} className={`p-2.5 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-50 text-moss-red shadow-inner shadow-red-100' : 'text-gray-400 hover:text-moss-blue hover:bg-gray-50'}`} title="Speak">
                  {isRecording ? <Mic className="animate-pulse" size={20} /> : <MicOff size={20} />}
                </button>
                <button onClick={() => handleSend(input)} disabled={loading || !input.trim()} className="p-2.5 rounded-full transition-all duration-300 bg-moss-blue text-white hover:bg-[#004c8c] hover:shadow-md hover:shadow-moss-blue/30 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none mx-1" title="Send message">
                  <Send size={18} className="translate-x-[1px]" />
                </button>
              </div>
            </div>

            <div className="mt-4 text-[13px] font-medium text-gray-400 pointer-events-auto text-center flex items-center justify-center gap-1.5 opacity-80">
              Powered by <span className="text-gray-600 font-semibold tracking-wide">MachineAvatars | AskGalore</span>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
