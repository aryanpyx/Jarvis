import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SettingsPanelProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onClose: () => void;
}

export default function SettingsPanel({ selectedLanguage, onLanguageChange, onClose }: SettingsPanelProps) {
  const userPreferences = useQuery(api.jarvis.getUserPreferences);
  const updatePreferences = useMutation(api.jarvis.updateUserPreferences);

  const handleLanguageChange = async (language: string) => {
    onLanguageChange(language);
    if (userPreferences) {
      await updatePreferences({
        ...userPreferences,
        preferredLanguage: language,
      });
    }
  };

  const handleVoiceToggle = async () => {
    if (userPreferences) {
      await updatePreferences({
        ...userPreferences,
        voiceEnabled: !userPreferences.voiceEnabled,
      });
    }
  };

  const handleAutoSpeakToggle = async () => {
    if (userPreferences) {
      await updatePreferences({
        ...userPreferences,
        autoSpeak: !userPreferences.autoSpeak,
      });
    }
  };

  const handleThemeChange = async (theme: string) => {
    if (userPreferences) {
      await updatePreferences({
        ...userPreferences,
        theme,
      });
    }
  };

  const handlePersonalityChange = async (personality: string) => {
    if (userPreferences) {
      await updatePreferences({
        ...userPreferences,
        personality,
      });
    }
  };

  return (
    <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-blue-400 font-semibold">Settings</h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Language Selection */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-400 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
        </div>

        {/* Voice Control */}
        <div>
          <label className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Voice Control</span>
            <button
              onClick={handleVoiceToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userPreferences?.voiceEnabled ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  userPreferences?.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Auto-Speak */}
        <div>
          <label className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Auto-Speak Responses</span>
            <button
              onClick={handleAutoSpeakToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                userPreferences?.autoSpeak !== false ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  userPreferences?.autoSpeak !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>

        {/* Personality */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Personality</label>
          <select
            value={userPreferences?.personality || 'professional'}
            onChange={(e) => handlePersonalityChange(e.target.value)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-400 focus:outline-none"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="witty">Witty</option>
            <option value="formal">Formal</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Theme</label>
          <select
            value={userPreferences?.theme || 'dark'}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-blue-400 focus:outline-none"
          >
            <option value="dark">Dark</option>
            <option value="blue">Blue</option>
            <option value="classic">Classic</option>
          </select>
        </div>
      </div>
    </div>
  );
}
