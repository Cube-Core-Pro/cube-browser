import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TierType = 'free' | 'pro' | 'elite';
export type ThemeType = 'light' | 'dark' | 'system' | 'elite-purple' | 'midnight';

export interface UserSettings {
  tier: TierType;
  theme: ThemeType;
  apiKeys: {
    openai?: string;
    anthropic?: string;
  };
  preferences: {
    autoSave: boolean;
    autoBackup: boolean;
    notificationsEnabled: boolean;
    telemetryEnabled: boolean;
    checkForUpdates: boolean;
  };
  browser: {
    defaultUserAgent?: string;
    clearCacheOnExit: boolean;
    enableJavaScript: boolean;
    enableImages: boolean;
    enableCookies: boolean;
  };
  automation: {
    defaultTimeout: number;
    retryAttempts: number;
    captureScreenshots: boolean;
    verboseLogging: boolean;
  };
  data: {
    defaultExportFormat: 'json' | 'csv' | 'xlsx';
    autoCleanup: boolean;
    retentionDays: number;
  };
}

export interface SettingsState {
  settings: UserSettings;
  
  // General settings
  setTier: (tier: TierType) => void;
  setTheme: (theme: ThemeType) => void;
  
  // API keys
  setApiKey: (service: 'openai' | 'anthropic', key: string) => void;
  removeApiKey: (service: 'openai' | 'anthropic') => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<UserSettings['preferences']>) => void;
  updateBrowserSettings: (settings: Partial<UserSettings['browser']>) => void;
  updateAutomationSettings: (settings: Partial<UserSettings['automation']>) => void;
  updateDataSettings: (settings: Partial<UserSettings['data']>) => void;
  
  // Helpers
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => boolean;
}

const defaultSettings: UserSettings = {
  tier: 'elite',
  theme: 'system',
  apiKeys: {},
  preferences: {
    autoSave: true,
    autoBackup: true,
    notificationsEnabled: true,
    telemetryEnabled: false,
    checkForUpdates: true,
  },
  browser: {
    clearCacheOnExit: false,
    enableJavaScript: true,
    enableImages: true,
    enableCookies: true,
  },
  automation: {
    defaultTimeout: 30000,
    retryAttempts: 3,
    captureScreenshots: true,
    verboseLogging: false,
  },
  data: {
    defaultExportFormat: 'json',
    autoCleanup: false,
    retentionDays: 30,
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      setTier: (tier) => {
        set((state) => ({
          settings: { ...state.settings, tier },
        }));
      },

      setTheme: (theme) => {
        set((state) => ({
          settings: { ...state.settings, theme },
        }));
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement;
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.toggle('dark', systemTheme === 'dark');
          } else {
            root.classList.toggle('dark', theme === 'dark');
          }
        }
      },

      setApiKey: (service, key) => {
        set((state) => ({
          settings: {
            ...state.settings,
            apiKeys: {
              ...state.settings.apiKeys,
              [service]: key,
            },
          },
        }));
      },

      removeApiKey: (service) => {
        set((state) => {
          const { [service]: _, ...restApiKeys } = state.settings.apiKeys;
          return {
            settings: {
              ...state.settings,
              apiKeys: restApiKeys,
            },
          };
        });
      },

      updatePreferences: (preferences) => {
        set((state) => ({
          settings: {
            ...state.settings,
            preferences: {
              ...state.settings.preferences,
              ...preferences,
            },
          },
        }));
      },

      updateBrowserSettings: (browserSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            browser: {
              ...state.settings.browser,
              ...browserSettings,
            },
          },
        }));
      },

      updateAutomationSettings: (automationSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            automation: {
              ...state.settings.automation,
              ...automationSettings,
            },
          },
        }));
      },

      updateDataSettings: (dataSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            data: {
              ...state.settings.data,
              ...dataSettings,
            },
          },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      exportSettings: () => {
        return JSON.stringify(get().settings, null, 2);
      },

      importSettings: (settingsJson) => {
        try {
          const parsedSettings = JSON.parse(settingsJson) as UserSettings;
          set({ settings: parsedSettings });
          return true;
        } catch (error) {
          console.error('Failed to import settings:', error);
          return false;
        }
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
