/**
 * useSettings.ts
 * 
 * Custom React hook for managing application settings.
 * - Stores selected LLM (Large Language Model) choice
 * - Stores selected database choice
 * - Provides functions to update LLM and database selections
 * - Persists settings to localStorage for persistence across sessions
 * - Returns current settings and setter functions
 * - May include default values for initial load
 */

import { useState, useEffect } from 'react';

interface Settings {
  database: string;
  llm: string;
}

interface TempSettings {
  database: string;
  llm: string;
}

interface UseSettingsReturn {
  settings: Settings;
  tempSettings: TempSettings;
  updateTempDatabase: (database: string) => void;
  updateTempLlm: (llm: string) => void;
  saveSettings: () => void;
  cancelSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  database: '',
  llm: ''
};

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<TempSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setTempSettings(parsed);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  const updateTempDatabase = (database: string) => {
    setTempSettings(prev => ({ ...prev, database }));
  };

  const updateTempLlm = (llm: string) => {
    setTempSettings(prev => ({ ...prev, llm }));
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('app-settings', JSON.stringify(tempSettings));
  };

  const cancelSettings = () => {
    // Reset temp settings to current saved settings
    setTempSettings(settings);
  };

  return {
    settings,
    tempSettings,
    updateTempDatabase,
    updateTempLlm,
    saveSettings,
    cancelSettings
  };
};