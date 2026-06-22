import type { Model } from '$lib/api/types';

interface StatusState {
  currentModel: Model | null;
  sessionTokensIn: number;
  sessionTokensOut: number;
  sessionCost: number;
  connectionStatus: 'connected' | 'degraded' | 'offline';
  creditBalance: number | null;
  isOnline: boolean;
}

export const status = $state<StatusState>({
  currentModel: null,
  sessionTokensIn: 0,
  sessionTokensOut: 0,
  sessionCost: 0,
  connectionStatus: 'connected',
  creditBalance: null,
  isOnline: true,
});