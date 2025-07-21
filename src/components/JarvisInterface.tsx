import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ChatMessage from "./ChatMessage";
import VoiceControl from "./VoiceControl";
import SettingsPanel from "./SettingsPanel";
import WakeWordDetection from "./WakeWordDetection";

export default function JarvisInterface() {
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [wakeWordActive, setWakeWordActive] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conversations = useQuery(api.jarvis.getConversations);
  const currentConversation = useQuery(
    api.jarvis.getConversation,
    currentConversationId ? { conversationId: currentConversationId } : "skip"
  );
  const userPreferences = useQuery(api.jarvis.getUserPreferences);

  const createConversation = useMutation(api.jarvis.createConversation);
  const generateResponse = useAction(api.jarvis.generateResponse);
  const initializeCommands = useMutation(api.jarvis.initializeSystemCommands);

  useEffect(() => {
    if (userPreferences?.preferredLanguage) {
      setSelectedLanguage(userPreferences.preferredLanguage);
    }
  }, [userPreferences]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  useEffect(() => {
    // Initialize system commands on first load
    if (conversations && conversations.length === 0) {
      initializeCommands();
    }
  }, [conversations, initializeCommands]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim()) return;

    try {
      setIsLoading(true);
      
      let conversationId = currentConversationId;
      
      if (!conversationId) {
        // Create new conversation
        const title = messageToSend.length > 50 
          ? messageToSend.substring(0, 50) + "..." 
          : messageToSend;
        
        conversationId = await createConversation({
          title,
          language: selectedLanguage,
        });
        setCurrentConversationId(conversationId);
      }

      if (!message) {
        setInputMessage("");
      }
      
      await generateResponse({
        conversationId,
        userMessage: messageToSend,
        language: selectedLanguage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = (transcript: string, autoSend: boolean = false) => {
    if (isCommandMode) {
      // In command mode, send the message directly
      handleSendMessage(transcript);
      setIsCommandMode(false);
    } else if (autoSend) {
      // Auto-send the message
      handleSendMessage(transcript);
    } else {
      // Regular voice input, put in text field
      setInputMessage(transcript);
      inputRef.current?.focus();
    }
  };

  const handleWakeWordDetected = () => {
    console.log("Wake word detected!");
    setIsCommandMode(true);
    setWakeWordActive(false); // Temporarily disable wake word detection
    
    // Play a sound or visual feedback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        selectedLanguage === 'hi' ? 'जी हां?' : 'Yes?'
      );
      utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleCommandModeEnd = () => {
    setIsCommandMode(false);
    // Re-enable wake word detection after a short delay
    setTimeout(() => {
      setWakeWordActive(true);
    }, 1000);
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setInputMessage("");
  };

  const selectConversation = (conversationId: Id<"conversations">) => {
    setCurrentConversationId(conversationId);
  };

  const getGreeting = () => {
    const greetings = {
      en: "Good day! I'm JARVIS, your advanced AI assistant. Say 'JARVIS' to activate voice commands, or use the mic for continuous voice input. Say 'send' and pause for 5 seconds to send your message.",
      hi: "नमस्कार! मैं जार्विस हूं, आपका उन्नत AI सहायक। वॉइस कमांड के लिए 'जार्विस' कहें, या निरंतर वॉइस इनपुट के लिए माइक का उपयोग करें। अपना संदेश भेजने के लिए 'भेजें' कहें और 5 सेकंड रुकें।"
    };
    return greetings[selectedLanguage as keyof typeof greetings] || greetings.en;
  };

  return (
    <div className="h-full flex gap-4">
      {/* Wake Word Detection Component */}
      <WakeWordDetection
        onWakeWordDetected={handleWakeWordDetected}
        language={selectedLanguage}
        isEnabled={userPreferences?.voiceEnabled ?? true}
        isActive={wakeWordActive && !isCommandMode}
      />

      {/* Sidebar */}
      <div className="w-80 bg-black/20 backdrop-blur-sm rounded-lg border border-blue-500/20 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-400">Conversations</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={startNewConversation}
              className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
              title="New Conversation"
            >
              ➕
            </button>
          </div>
        </div>

        {showSettings && (
          <SettingsPanel
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Wake Word Status */}
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-400 font-medium">Wake Word</span>
            <div className={`w-2 h-2 rounded-full ${
              wakeWordActive && !isCommandMode && (userPreferences?.voiceEnabled ?? true)
                ? 'bg-green-400 animate-pulse' 
                : 'bg-slate-600'
            }`} />
          </div>
          <p className="text-xs text-slate-400">
            {isCommandMode 
              ? (selectedLanguage === 'hi' ? 'सुन रहा हूं...' : 'Listening for command...')
              : (selectedLanguage === 'hi' ? '"जार्विस" कहें' : 'Say "JARVIS" to activate')
            }
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations?.map((conv) => (
            <button
              key={conv._id}
              onClick={() => selectConversation(conv._id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentConversationId === conv._id
                  ? "bg-blue-500/30 border border-blue-400/50"
                  : "bg-slate-800/50 hover:bg-slate-700/50"
              }`}
            >
              <div className="text-sm text-blue-300 truncate">{conv.title}</div>
              <div className="text-xs text-slate-400 mt-1">
                {conv.messages.length} messages • {conv.language.toUpperCase()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-lg border border-blue-500/20 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center mb-6">
                <span className="text-black font-bold text-2xl">J</span>
              </div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">JARVIS Online</h2>
              <p className="text-slate-300 max-w-md mb-4">
                {getGreeting()}
              </p>
              
              {/* Command Mode Indicator */}
              {isCommandMode && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-400/50 rounded-lg">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 font-medium">
                      {selectedLanguage === 'hi' ? 'आपका आदेश सुन रहा हूं...' : 'Listening for your command...'}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
                  <h4 className="text-blue-400 font-semibold mb-2">🎤 Wake Word</h4>
                  <p className="text-sm text-slate-400">Say "JARVIS" to activate</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
                  <h4 className="text-blue-400 font-semibold mb-2">🌐 Multi-language</h4>
                  <p className="text-sm text-slate-400">English and Hindi support</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
                  <h4 className="text-blue-400 font-semibold mb-2">🧠 AI Knowledge</h4>
                  <p className="text-sm text-slate-400">Access vast information</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
                  <h4 className="text-blue-400 font-semibold mb-2">⚡ Voice Control</h4>
                  <p className="text-sm text-slate-400">Hands-free interaction</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {currentConversation.messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  language={selectedLanguage}
                  autoSpeak={
                    message.role === 'assistant' && 
                    index === currentConversation.messages.length - 1 &&
                    userPreferences?.voiceEnabled !== false &&
                    userPreferences?.autoSpeak !== false
                  }
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                    <span className="text-black font-bold text-xs">J</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-blue-500/20">
          {isCommandMode ? (
            <VoiceControl
              onVoiceInput={handleVoiceInput}
              language={selectedLanguage}
              isEnabled={userPreferences?.voiceEnabled ?? true}
              isCommandMode={true}
              onCommandModeEnd={handleCommandModeEnd}
            />
          ) : (
            <div className="flex gap-3 items-end">
              <VoiceControl
                onVoiceInput={handleVoiceInput}
                language={selectedLanguage}
                isEnabled={userPreferences?.voiceEnabled ?? true}
                isCommandMode={false}
              />
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedLanguage === "hi" 
                      ? "जार्विस से बात करें, माइक का उपयोग करें, या 'जार्विस' कहें..." 
                      : "Talk to JARVIS, use mic, or say 'JARVIS'..."
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-blue-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
