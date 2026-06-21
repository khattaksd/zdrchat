import { create } from 'zustand';
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
  setApiKey: (key: string) => void;
  setDefaultModel: (model: string) => void;
  setTheme: (t: ThemeName) => void;
  setAccentColor: (c: string) => void;
  setZdrOnly: (v: boolean) => void;
  setNoTraining: (v: boolean) => void;
  setModels: (m: Model[]) => void;
  setCreditBalance: (b: number | null) => void;
  setIsInitialized: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: '',
  defaultModel: '',
  theme: 'dark',
  accentColor: '#3b82f6',
  zdrOnly: true,
  noTraining: true,
  models: [],
  creditBalance: null,
  isInitialized: false,

  setApiKey: (apiKey) => set({ apiKey }),
  setDefaultModel: (defaultModel) => set({ defaultModel }),
  setTheme: (theme) => set({ theme }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setZdrOnly: (zdrOnly) => set({ zdrOnly }),
  setNoTraining: (noTraining) => set({ noTraining }),
  setModels: (models) => set({ models }),
  setCreditBalance: (creditBalance) => set({ creditBalance }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),
}));
