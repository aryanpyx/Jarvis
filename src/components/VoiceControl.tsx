import { useState, useRef, useEffect } from "react";

interface VoiceControlProps {
  onVoiceInput: (transcript: string, autoSend?: boolean) => void;
  language: string;
  isEnabled: boolean;
  isCommandMode?: boolean;
  onCommandModeEnd?: () => void;
}

export default function VoiceControl({ 
  onVoiceInput, 
  language, 
  isEnabled, 
  isCommandMode = false,
  onCommandModeEnd 
}: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [pendingSend, setPendingSend] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = currentTranscript + finalTranscript;
        const displayTranscript = fullTranscript + interimTranscript;

        // Update the input field with current transcript
        onVoiceInput(displayTranscript, false);

        if (finalTranscript) {
          setCurrentTranscript(fullTranscript);
          
          // Check if the final transcript ends with "send" command
          const lowerTranscript = finalTranscript.toLowerCase().trim();
          const sendCommands = language === 'hi' 
            ? ['भेजें', 'भेज दो', 'send', 'भेजो'] 
            : ['send', 'send it', 'submit'];
          
          const endsWithSend = sendCommands.some(cmd => 
            lowerTranscript.endsWith(cmd) || 
            lowerTranscript.endsWith(cmd + '.')
          );
          
          if (endsWithSend) {
            setPendingSend(true);
            
            // Clear any existing send timeout
            if (sendTimeoutRef.current) {
              clearTimeout(sendTimeoutRef.current);
            }
            
            // Set 5-second timeout to send message
            sendTimeoutRef.current = setTimeout(() => {
              // Remove the send command from the transcript
              let cleanTranscript = fullTranscript;
              for (const cmd of sendCommands) {
                const regex = new RegExp(`\\s*${cmd}\\.?\\s*$`, 'i');
                cleanTranscript = cleanTranscript.replace(regex, '');
              }
              
              // Send the message
              onVoiceInput(cleanTranscript.trim(), true);
              
              // Reset state
              setCurrentTranscript("");
              setPendingSend(false);
              
              // End command mode if active
              if (isCommandMode && onCommandModeEnd) {
                onCommandModeEnd();
              }
            }, 5000);
          } else if (pendingSend) {
            // If user continues speaking after saying "send", cancel the pending send
            setPendingSend(false);
            if (sendTimeoutRef.current) {
              clearTimeout(sendTimeoutRef.current);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Restart recognition after error (except if it's not-allowed)
        if (event.error !== 'not-allowed' && isEnabled) {
          restartTimeoutRef.current = setTimeout(() => {
            if (!isCommandMode) {
              startListening();
            }
          }, 1000);
        }
        
        // End command mode on error
        if (isCommandMode && onCommandModeEnd) {
          onCommandModeEnd();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        
        // Auto-restart recognition if it should be active (for continuous listening)
        if (isEnabled && !isCommandMode) {
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 100);
        }
        
        // End command mode when recognition ends
        if (isCommandMode && onCommandModeEnd) {
          onCommandModeEnd();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [language, onVoiceInput, isCommandMode, onCommandModeEnd, currentTranscript, pendingSend, isEnabled]);

  // Auto-start listening when in command mode
  useEffect(() => {
    if (isCommandMode && isSupported && isEnabled && !isListening) {
      startListening();
      
      // Set timeout to end command mode if no input
      commandTimeoutRef.current = setTimeout(() => {
        if (onCommandModeEnd) {
          onCommandModeEnd();
        }
      }, 10000); // 10 second timeout for command mode
    }
    
    return () => {
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, [isCommandMode, isSupported, isEnabled, isListening, onCommandModeEnd]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
        setCurrentTranscript("");
        setPendingSend(false);
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
    }
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    setCurrentTranscript("");
    setPendingSend(false);
  };

  if (!isSupported || !isEnabled) {
    return null;
  }

  // In command mode, show different UI
  if (isCommandMode) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-400/50 rounded-lg">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 text-sm font-medium">
          {pendingSend 
            ? (language === 'hi' ? 'भेजा जा रहा है...' : 'Sending in 5s...')
            : (language === 'hi' ? 'सुन रहा हूं...' : 'Listening...')
          }
        </span>
        <button
          onClick={() => onCommandModeEnd?.()}
          className="ml-2 text-green-400 hover:text-green-300 transition-colors"
          title="Cancel"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      className={`p-3 rounded-lg transition-all ${
        isListening
          ? pendingSend
            ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse'
            : 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
      }`}
      title={
        isListening 
          ? pendingSend 
            ? "Sending in 5 seconds..." 
            : "Stop continuous listening" 
          : "Start continuous voice input"
      }
    >
      {isListening 
        ? pendingSend 
          ? "⏳" 
          : "🔴" 
        : "🎤"
      }
    </button>
  );
}
