import { useState, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  language?: string;
}

interface ChatMessageProps {
  message: Message;
  language: string;
  autoSpeak?: boolean;
}

export default function ChatMessage({ message, language, autoSpeak = false }: ChatMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAutoSpoken, setHasAutoSpoken] = useState(false);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const speakMessage = () => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = message.role === 'assistant' ? 0.8 : 1.0;
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Auto-speak JARVIS responses when they first appear
  useEffect(() => {
    if (
      autoSpeak && 
      message.role === 'assistant' && 
      !hasAutoSpoken && 
      'speechSynthesis' in window
    ) {
      // Small delay to ensure the message is fully rendered
      const timer = setTimeout(() => {
        speakMessage();
        setHasAutoSpoken(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [autoSpeak, message.role, hasAutoSpoken]);

  return (
    <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-xs">J</span>
        </div>
      )}
      
      <div className={`max-w-[70%] ${message.role === 'user' ? 'order-first' : ''}`}>
        <div
          className={`p-4 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-600 text-white ml-auto'
              : 'bg-slate-800/70 text-slate-100 border border-blue-500/20'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        
        <div className={`flex items-center gap-2 mt-2 text-xs text-slate-400 ${
          message.role === 'user' ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.role === 'assistant' && (
            <button
              onClick={isPlaying ? stopSpeaking : speakMessage}
              className="p-1 rounded hover:bg-slate-700/50 transition-colors"
              title={isPlaying ? "Stop speaking" : "Speak message"}
            >
              {isPlaying ? "🔇" : "🔊"}
            </button>
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xs">U</span>
        </div>
      )}
    </div>
  );
}
