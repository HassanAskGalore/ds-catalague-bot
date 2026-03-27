'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Globe, Send, SlidersHorizontal, Trash2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SourceCard from './SourceCard';
import SearchFilters from './SearchFilters';
import { chatAPI, ChatResponse } from '@/lib/api';
import { fetchLipSync, base64ToAudioUrl, type RhubarbMouthCue } from '@/lib/rhubarbLipSync';
import AvatarWithLipSync, { type AvatarHandle } from './AvatarWithLipSync';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: ChatResponse['sources'];
  format?: 'text' | 'table';
  tableData?: any[];
}

export default function ChatWindowWithRhubarb() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<AvatarHandle>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ===== SPEECH-TO-TEXT (STT) using Azure via Backend =====
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingDuration = Date.now() - recordingStartTimeRef.current;
        console.log(`[STT] Recording duration: ${recordingDuration}ms`);
        
        if (recordingDuration < 300) {
          alert('Recording too short. Please speak for at least 1 second.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        console.log('[STT] Processing recorded audio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log(`[STT] Audio blob size: ${audioBlob.size} bytes`);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005';
            console.log('[STT] Sending to backend...');
            const response = await fetch(`${backendUrl}/speech-to-text`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio })
            });

            if (!response.ok) {
              throw new Error(`STT failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[STT] Response:', data);
            
            if (data.success && data.text) {
              console.log('[STT] Recognized:', data.text);
              setInput(data.text);
            } else {
              alert('No speech recognized. Please:\n1. Speak clearly and loudly\n2. Hold the button while speaking\n3. Speak for at least 2-3 seconds');
            }
          } catch (error) {
            console.error('[STT] Backend error:', error);
            alert('Speech recognition failed. Please check backend is running.');
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('[STT] Recording started - speak now...');

    } catch (error) {
      console.error('[STT] Failed to start:', error);
      alert('Failed to access microphone. Please grant microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[STT] Stopping recording...');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Rhubarb lip-sync animation
  const animateLipSync = (audio: HTMLAudioElement, mouthCues: RhubarbMouthCue[]) => {
    let currentCueIndex = 0;

    console.log('[Rhubarb] Setting up lip-sync with', mouthCues.length, 'cues');
    console.log('[Rhubarb] First 5 cues:', mouthCues.slice(0, 5));

    const updateMouthShape = () => {
      if (!audio || audio.paused || audio.ended) {
        avatarRef.current?.setMouthShape('X');
        return;
      }

      const currentTime = audio.currentTime;

      // Find current mouth cue
      while (currentCueIndex < mouthCues.length - 1 &&
             currentTime >= mouthCues[currentCueIndex + 1].start) {
        currentCueIndex++;
      }

      const currentCue = mouthCues[currentCueIndex];
      
      if (currentCue && currentTime >= currentCue.start && currentTime <= currentCue.end) {
        if (avatarRef.current) {
          avatarRef.current.setMouthShape(currentCue.value);
          // Only log every 10th frame to reduce spam
          if (Math.random() < 0.1) {
            console.log(`[Rhubarb] Time: ${currentTime.toFixed(2)}s, Shape: ${currentCue.value}, CueIndex: ${currentCueIndex}/${mouthCues.length}`);
          }
        } else {
          console.warn('[Rhubarb] avatarRef.current is null!');
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateMouthShape);
    };

    // Add event listeners BEFORE playing
    audio.addEventListener('play', () => {
      console.log('[Rhubarb] Audio play event fired');
      console.log('[Rhubarb] avatarRef.current exists:', !!avatarRef.current);
      console.log('[Rhubarb] Audio duration:', audio.duration);
      setIsSpeaking(true);
      updateMouthShape();
    });

    audio.addEventListener('ended', () => {
      console.log('[Rhubarb] Audio ended');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      avatarRef.current?.reset();
      setIsSpeaking(false);
    });

    audio.addEventListener('pause', () => {
      console.log('[Rhubarb] Audio paused');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      avatarRef.current?.reset();
      setIsSpeaking(false);
    });

    audio.addEventListener('error', (e) => {
      console.error('[Rhubarb] Audio error:', e);
      setIsSpeaking(false);
      avatarRef.current?.reset();
    });

    audio.addEventListener('timeupdate', () => {
      // Log time updates to verify audio is actually playing
      if (Math.random() < 0.05) {
        console.log('[Rhubarb] Audio timeupdate:', audio.currentTime.toFixed(2));
      }
    });
  };

  // Speak text using Rhubarb lip-sync
  const speakText = async (text: string) => {
    try {
      console.log('[TTS] Starting speech synthesis for:', text.substring(0, 50) + '...');
      
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setIsSpeaking(true);

      console.log('[Rhubarb] Fetching lip-sync data from backend...');
      const response = await fetchLipSync(text, 'user123', 'Female_2');

      console.log('[Rhubarb] Received response:', {
        textLength: response.text.length,
        mouthCues: response.lipsync.mouthCues.length,
        duration: response.lipsync.metadata.duration,
        hasAudio: !!response.audio
      });

      if (!response.audio) {
        throw new Error('No audio data received from backend');
      }

      // Create audio from base64
      console.log('[TTS] Decoding audio from base64...');
      const audioUrl = base64ToAudioUrl(response.audio);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      // Start lip-sync animation
      console.log('[TTS] Starting lip-sync animation...');
      animateLipSync(audio, response.lipsync.mouthCues);

      // Play audio
      console.log('[TTS] Playing audio...');
      await audio.play();
      console.log('[TTS] Audio playback started successfully');

    } catch (error) {
      console.error('[TTS] Error:', error);
      alert(`TTS Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck:\n1. Backend is running on port 8000\n2. Azure Speech key is configured\n3. FFmpeg is installed\n4. Rhubarb executable exists`);
      setIsSpeaking(false);
      avatarRef.current?.reset();
    }
  };

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsSpeaking(false);
    avatarRef.current?.reset();
  };

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
      // If autoSpeak is enabled, use lip-sync endpoint (includes answer + audio + lip-sync)
      if (autoSpeak) {
        console.log('[Chat] Using lip-sync endpoint for integrated response');
        
        // Show "thinking" message immediately
        const thinkingMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: '...',
          isUser: false,
          timestamp: new Date(),
          format: 'text',
        };
        setMessages((prev) => [...prev, thinkingMessage]);
        
        const lipSyncResponse = await fetchLipSync(text, 'user123', 'Female_2');
        
        // Replace thinking message with actual response
        setMessages((prev) => {
          const filtered = prev.filter(m => m.id !== thinkingMessage.id);
          return [...filtered, {
            id: thinkingMessage.id,
            text: lipSyncResponse.text,
            isUser: false,
            timestamp: new Date(),
            format: 'text',
          }];
        });

        // Play audio with lip-sync immediately
        if (lipSyncResponse.audio) {
          // Stop any currently playing audio
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
          }

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }

          setIsSpeaking(true);

          const audioUrl = base64ToAudioUrl(lipSyncResponse.audio);
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;

          animateLipSync(audio, lipSyncResponse.lipsync.mouthCues);
          await audio.play();
        }
      } else {
        // Use regular chat endpoint (no audio)
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
      }
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
      
      {/* LEFT PANEL: 3D Avatar */}
      <div className="hidden lg:flex lg:w-[35%] h-full relative z-20 border-r border-[#e2e8f0] shadow-xl items-center justify-center bg-[#0a0c10]">
        
        {/* Voice Toggle Button */}
        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              }
              setAutoSpeak(!autoSpeak);
            }}
            className={`p-3 backdrop-blur-xl rounded-full border border-white/20 text-white hover:scale-105 transition-all shadow-lg ${autoSpeak ? 'bg-moss-blue/80' : 'bg-white/10 hover:bg-white/20'}`}
            title={autoSpeak ? 'Voice ON - Click to disable' : 'Voice OFF - Click to enable'}
          >
            {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* The 3D Avatar with Rhubarb Lip Sync */}
        <AvatarWithLipSync ref={avatarRef} isSpeaking={isSpeaking} />
        
        {/* Branding */}
        <div className="absolute bottom-6 left-6 z-30 font-semibold text-white/50 tracking-wider text-xs flex items-center gap-2 drop-shadow-md">
          <span>MOSDORFER BOT</span>
        </div>
      </div>

      {/* RIGHT PANEL: Chat Interface */}
      <div className="flex-1 flex flex-row h-full w-full lg:w-[65%] relative z-10">
        
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
          
          {/* Header */}
          <div className="absolute top-0 w-full px-6 py-4 flex items-center justify-between z-20 bg-gradient-to-b from-[#f8f9fa] to-transparent pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <img src="/mosdorfer-logo.png" alt="Mosdorfer" className="h-10 w-auto object-contain" />
              <span className="font-bold text-moss-dark tracking-tight">AI Assistant</span>
            </div>
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
                <p className="text-gray-500 mb-10 text-lg">Ask me anything about Mosdorfer products with Rhubarb lip-sync!</p>
                
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

          {/* Input Container */}
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
                <button 
                  onClick={toggleRecording} 
                  className={`p-2.5 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-50 text-moss-red shadow-inner shadow-red-100 animate-pulse' : 'text-gray-400 hover:text-moss-blue hover:bg-gray-50'}`} 
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRecording ? <Mic className="animate-pulse" size={20} /> : <MicOff size={20} />}
                </button>
                <button 
                  onClick={() => handleSend(input)} 
                  disabled={loading || !input.trim()} 
                  className="p-2.5 rounded-full transition-all duration-300 bg-moss-blue text-white hover:bg-[#004c8c] hover:shadow-md hover:shadow-moss-blue/30 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none mx-1" 
                  title="Send message"
                >
                  <Send size={18} className="translate-x-[1px]" />
                </button>
              </div>
            </div>

            <div className="mt-4 text-[13px] font-medium text-gray-400 pointer-events-auto text-center flex items-center justify-center gap-1.5 opacity-80">
              Powered by <span className="text-gray-600 font-semibold tracking-wide">MachineAvtars | AskGalore </span>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
