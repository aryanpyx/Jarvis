import { useState, useRef, useEffect } from "react";

interface WakeWordDetectionProps {
  onWakeWordDetected: () => void;
  language: string;
  isEnabled: boolean;
  isActive: boolean;
}

export default function WakeWordDetection({ 
  onWakeWordDetected, 
  language, 
  isEnabled, 
  isActive 
}: WakeWordDetectionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.toLowerCase().trim();
          
          // Check for wake words in different languages
          const wakeWords = language === 'hi' 
            ? ['जार्विस', 'jarvis'] 
            : ['jarvis', 'hey jarvis', 'ok jarvis'];
          
          const isWakeWord = wakeWords.some(word => 
            transcript.includes(word) || 
            transcript.startsWith(word)
          );
          
          if (isWakeWord) {
            onWakeWordDetected();
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Wake word detection error:', event.error);
        setIsListening(false);
        
        // Restart recognition after error (except if it's not-allowed)
        if (event.error !== 'not-allowed' && isEnabled && isActive) {
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 1000);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        
        // Restart recognition if it should be active
        if (isEnabled && isActive) {
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 100);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [language, onWakeWordDetected, isEnabled, isActive]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && isEnabled && isActive) {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start wake word detection:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
  };

  // Start/stop listening based on props
  useEffect(() => {
    if (isEnabled && isActive && isSupported) {
      startListening();
    } else {
      stopListening();
    }
  }, [isEnabled, isActive, isSupported]);

  if (!isSupported || !isEnabled) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isListening && isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-600'
      }`} />
      <span className="text-xs text-slate-400">
        {isListening && isActive ? 'Listening for "JARVIS"...' : 'Wake word inactive'}
      </span>
    </div>
  );
}
