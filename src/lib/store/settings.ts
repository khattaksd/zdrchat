import { writable } from 'svelte/store';
import type { Model } from '../api/types';

export type ThemeName = 'light' | 'dark' | 'sepia' | 'nord' | 'catppuccin' | 'tokyo-night';

export interface SettingsState {
  apiKey: string;
  defaultModel: string;
  theme: ThemeName;
  accentColor: string;
  zdrOnly: boolean;
  noTraining: boolean;
  models: Model[];
  creditBalance: number | null;
  isInitialized: boolean;
}

function createSettingsStore() {
  const { subscribe, update } = writable<SettingsState>({
    apiKey: '',
    defaultModel: '',
    theme: 'dark',
    accentColor: '#3b82f6',
    zdrOnly: false,
    noTraining: false,
    models: [],
    creditBalance: null,
    isInitialized: false,
  });

  return {
    subscribe,
    setApiKey: (apiKey: string) => update(s => ({ ...s, apiKey })),
    setDefaultModel: (defaultModel: string) => update(s => ({ ...s, defaultModel })),
    setTheme: (theme: ThemeName) => update(s => ({ ...s, theme })),
    setAccentColor: (accentColor: string) => update(s => ({ ...s, accentColor })),
    setZdrOnly: (zdrOnly: boolean) => update(s => ({ ...s, zdrOnly })),
    setNoTraining: (noTraining: boolean) => update(s => ({ ...s, noTraining })),
    setModels: (models: Model[]) => update(s => ({ ...s, models })),
    setCreditBalance: (creditBalance: number | null) => update(s => ({ ...s, creditBalance })),
    setIsInitialized: (isInitialized: boolean) => update(s => ({ ...s, isInitialized })),
  };
}

export const settingsStore = createSettingsStore();