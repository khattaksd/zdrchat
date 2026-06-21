import { create } from 'zustand';
import type { Model } from '../api/types';

export interface StatusState {
  currentModel: Model | null;
  sessionTokensIn: number;
  sessionTokensOut: number;
  sessionCost: number;
  connectionStatus: 'connected' | 'degraded' | 'offline';
  creditBalance: number | null;
  isOnline: boolean;
  setCurrentModel: (m: Model | null) => void;
  addTokens: (inTokens: number, outTokens: number, cost: number) => void;
  resetSession: () => void;
  setConnectionStatus: (s: 'connected' | 'degraded' | 'offline') => void;
  setCreditBalance: (b: number | null) => void;
  setIsOnline: (v: boolean) => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  currentModel: null,
  sessionTokensIn: 0,
  sessionTokensOut: 0,
  sessionCost: 0,
  connectionStatus: 'connected',
  creditBalance: null,
  isOnline: true,

  setCurrentModel: (currentModel) => set({ currentModel }),
  addTokens: (tokensIn, tokensOut, cost) =>
    set((s) => ({
      sessionTokensIn: s.sessionTokensIn + tokensIn,
      sessionTokensOut: s.sessionTokensOut + tokensOut,
      sessionCost: s.sessionCost + cost,
    })),
  resetSession: () => set({ sessionTokensIn: 0, sessionTokensOut: 0, sessionCost: 0 }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setCreditBalance: (creditBalance) => set({ creditBalance }),
  setIsOnline: (isOnline) => set({ isOnline }),
}));
