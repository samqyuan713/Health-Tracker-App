import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MetricLog } from '../types';
import { getStatsForDay } from '../utils';
import { Send, Sparkles, AlertCircle, Compass, Zap } from 'lucide-react';

interface AICoachProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  logs: MetricLog[];
  selectedDate: string;
  isGenerating: boolean;
}

export default function AICoach({ 
  chatHistory, 
  onSendMessage, 
  logs, 
  selectedDate, 
  isGenerating 
}: AICoachProps) {
  const [userInput, setUserInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isGenerating]);

  const handleSend = () => {
    if (!userInput.trim() || isGenerating) return;
    onSendMessage(userInput.trim());
    setUserInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const quickPrompts = [
    { text: "📊 Coach, review my health logs progress", tag: "Review Logs" },
    { text: "💧 How do I reach my daily water intake?", tag: "Water Guide" },
    { text: "🛌 Sleep hygiene tips for deeper rest", tag: "Sleep Tips" },
    { text: "🏋️ Suggest a quick 10-minute home workout", tag: "Quick Fitness" }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/55 overflow-hidden relative select-none">
      
      {/* Coach Header info */}
      <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 flex items-center justify-center shadow-sm">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-base select-none">
            🦁
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-black text-slate-800">Coach Leo</h3>
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-[8px] font-extrabold text-emerald-700 rounded-md border border-emerald-100">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600 animate-pulse" /> AI Partner
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Active Lifestyle Consultant</p>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        
        {chatHistory.length === 0 ? (
          /* Empty State / Welcome Screen matching VitalStream Pro style */
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center select-none space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center text-2xl">
              🦁
            </div>
            
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight">Meet Coach Leo</h4>
              <p className="text-[10px] text-slate-500 max-w-[210px] mx-auto mt-1 leading-relaxed font-semibold">
                Your personal VitalStream companion! I analyze hydration metrics, activity thresholds, and sleep cycles to recommend tailored improvements.
              </p>
            </div>

            {/* Quick Trigger Prompts list */}
            <div className="w-full max-w-[280px] space-y-1.5 pt-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1 mb-2">
                <Compass className="w-3 h-3 text-slate-400" /> Choose a Quick Guide
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {quickPrompts.map((p, i) => (
                  <button
                    id={`quick-prompt-${i}`}
                    key={i}
                    onClick={() => onSendMessage(p.text)}
                    className="w-full text-left p-3 bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-xl text-[10px] font-bold text-slate-700 transition-all flex items-center justify-between group cursor-pointer shadow-sm active:scale-98"
                  >
                    <span>{p.tag}</span>
                    <Zap className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages Stream */
          <div className="space-y-4 pb-4">
            
            {/* System Disclaimer Bubble */}
            <div className="bg-slate-100/50 text-[9px] text-slate-400 font-semibold leading-normal p-2.5 rounded-xl border border-slate-200/50 text-center flex items-center gap-1.5 justify-center select-none shadow-sm">
              <AlertCircle className="w-3 h-3 shrink-0 text-slate-500" />
              <span>Coaching triggers are generated via Gemini models. Consult medical specialists for critical diagnostic advice.</span>
            </div>

            {chatHistory.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fadeIn`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed shadow-sm ${
                    isAssistant 
                      ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/80' 
                      : 'bg-emerald-600 text-white rounded-tr-sm font-semibold'
                  }`}>
                    {/* Render newlines correctly */}
                    <div className="space-y-1 whitespace-pre-line">
                      {msg.content}
                    </div>
                    {/* Timestamp */}
                    <span className={`block text-[8px] font-mono mt-1 ${
                      isAssistant ? 'text-slate-400 text-left' : 'text-emerald-100 text-right'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Loader Indicator */}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs border border-slate-200/85 shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef}></div>
          </div>
        )}

      </div>

      {/* Input Action Panel */}
      <div className="p-3 bg-white border-t border-slate-200/80 relative z-10 shrink-0">
        <div className="flex gap-2">
          <input
            id="coach-input-field"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isGenerating}
            placeholder={isGenerating ? "Leo is analyzing your request..." : "Ask Coach Leo anything..."}
            className="flex-1 h-11 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500/80 disabled:opacity-40 transition-all shrink-0 select-text font-medium"
          />
          <button
            id="coach-send-btn"
            onClick={handleSend}
            disabled={!userInput.trim() || isGenerating}
            className="w-11 h-11 bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-30 rounded-xl flex items-center justify-center transition-all cursor-pointer border border-emerald-600"
          >
            <Send className="w-3.5 h-3.5 fill-white" />
          </button>
        </div>
      </div>

    </div>
  );
}
