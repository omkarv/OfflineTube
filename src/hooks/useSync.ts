import { useEffect, useState, useCallback } from 'react';
import { performInitialSync, checkAndSync } from '../services/syncService';
import { getSyncVersion, getLastSyncAt } from '../storage/mmkv';
import { useOfflineStatus } from './useOfflineStatus';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncVersion: number;
  error: string | null;
  stationsCount: number;
  coffeeShopsCount: number;
}

export function useSync() {
  const { isOnline } = useOfflineStatus();
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: getLastSyncAt(),
    syncVersion: getSyncVersion(),
    error: null,
    stationsCount: 0,
    coffeeShopsCount: 0,
  });

  const sync = useCallback(async () => {
    if (state.isSyncing || !isOnline) return;

    setState((s) => ({ ...s, isSyncing: true, error: null }));

    try {
      const result = await performInitialSync();

      setState((s) => ({
        ...s,
        isSyncing: false,
        lastSyncAt: getLastSyncAt(),
        syncVersion: getSyncVersion(),
        stationsCount: result.stationsCount,
        coffeeShopsCount: result.coffeeShopsCount,
        error: result.error || null,
      }));
    } catch (error) {
      setState((s) => ({
        ...s,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, [isOnline, state.isSyncing]);

  // Auto-sync on mount if needed
  useEffect(() => {
    const doInitialSync = async () => {
      if (isOnline && getSyncVersion() === 0) {
        await sync();
      }
    };
    doInitialSync();
  }, [isOnline]);

  return {
    ...state,
    sync,
    needsSync: state.syncVersion === 0,
  };
}
