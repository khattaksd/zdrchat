import { writable } from 'svelte/store';
import type { Model } from '$lib/api/types';

export interface StatusState {
  currentModel: Model | null;
  sessionTokensIn: number;
  sessionTokensOut: number;
  sessionCost: number;
  connectionStatus: 'connected' | 'degraded' | 'offline';
  creditBalance: number | null;
  isOnline: boolean;
}

function createStatusStore() {
  const { subscribe, update } = writable<StatusState>({
    currentModel: null,
    sessionTokensIn: 0,
    sessionTokensOut: 0,
    sessionCost: 0,
    connectionStatus: 'connected',
    creditBalance: null,
    isOnline: true,
  });

  return {
    subscribe,
    setCurrentModel: (currentModel: Model | null) => update(s => ({ ...s, currentModel })),
    addTokens: (tokensIn: number, tokensOut: number, cost: number) =>
      update(s => ({
        ...s,
        sessionTokensIn: s.sessionTokensIn + tokensIn,
        sessionTokensOut: s.sessionTokensOut + tokensOut,
        sessionCost: s.sessionCost + cost,
      })),
    resetSession: () => update(s => ({ ...s, sessionTokensIn: 0, sessionTokensOut: 0, sessionCost: 0 })),
    setConnectionStatus: (connectionStatus: 'connected' | 'degraded' | 'offline') => update(s => ({ ...s, connectionStatus })),
    setCreditBalance: (creditBalance: number | null) => update(s => ({ ...s, creditBalance })),
    setIsOnline: (isOnline: boolean) => update(s => ({ ...s, isOnline })),
  };
}

export const statusStore = createStatusStore();