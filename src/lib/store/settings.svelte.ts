import type { Model } from '$lib/api/types';

export type ThemeName = 'light' | 'dark' | 'sepia' | 'nord' | 'catppuccin' | 'tokyo-night';

interface SettingsState {
  apiKey: string;
  defaultModel: string;
  theme: ThemeName;
  accentColor: string;
  zdrOnly: boolean;
  noTraining: boolean;
  models: Model[];
  creditBalance: number | null;
  popularModelIds: string[];
  popularModelAsOf: string;
  isInitialized: boolean;
}

export const settings = $state<SettingsState>({
  apiKey: '',
  defaultModel: '',
  theme: 'dark',
  accentColor: '#3b82f6',
  zdrOnly: true,
  noTraining: true,
  models: [],
  creditBalance: null,
  popularModelIds: [],
  popularModelAsOf: '',
  isInitialized: false,
});