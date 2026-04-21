import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { seraphEmitter, type SyncStatus } from '../services/ble/nativeModule';

export interface SyncState {
  status: SyncStatus['status'];
  packetsReceived: number;
  latestDate: string | null;
  affectedDates: string[];
  error: string | null;
  isSyncing: boolean;
  isBusy: boolean;
}

/**
 * Subscribe to native sync state. Automatically invalidates all queries
 * when sync completes so every screen refreshes from DB.
 */
export function useSyncState(): SyncState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SyncState>({
    status: 'idle',
    packetsReceived: 0,
    latestDate: null,
    affectedDates: [],
    error: null,
    isSyncing: false,
    isBusy: false,
  });

  useEffect(() => {
    const sub = seraphEmitter.addListener('onSyncStateChange', (event: SyncStatus) => {
      const isSyncing = event.status === 'syncing';

      setState({
        status: event.status,
        packetsReceived: event.status === 'syncing' ? event.packetsReceived : 0,
        latestDate: event.status === 'syncing' ? (event.latestDate ?? null) : null,
        affectedDates: event.status === 'complete' ? event.affectedDates : [],
        error: event.status === 'error' ? event.message : null,
        isSyncing,
        isBusy: isSyncing,
      });

      if (event.status === 'complete') {
        void queryClient.invalidateQueries();
      }
    });

    return () => {
      sub.remove();
    };
  }, [queryClient]);

  return state;
}
