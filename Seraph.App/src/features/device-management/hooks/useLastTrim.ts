import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDeviceStore } from '../store/deviceStore';
import {
  nativeGetLastTrim,
  seraphEmitter,
  type LastTrimInfo,
} from '../../../services/ble/nativeModule';
import { appParametersRepository } from '../../../services/database/drizzle';

export interface LastTrimData {
  trimValue: number;
  r24Timestamp: number | null; // ms epoch of the R24 packet at that sequence
}

export function useLastTrim() {
  const isConnected = useDeviceStore(state => state.isConnected);
  const queryClient = useQueryClient();

  useEffect(() => {
    const sub = seraphEmitter.addListener('onTrimUpdated', () => {
      void queryClient.invalidateQueries({ queryKey: ['lastTrim'] });
    });
    return () => {
      sub.remove();
    };
  }, [queryClient]);

  // Try native first (live, from service). Fall back to DB read when not connected.
  return useQuery<LastTrimData | null>({
    queryKey: ['lastTrim', isConnected],
    queryFn: async () => {
      if (isConnected) {
        const info: LastTrimInfo | null = await nativeGetLastTrim();
        if (!info) return null;
        return {
          trimValue: info.trimValue,
          r24Timestamp: info.r24Timestamp ?? null,
        };
      }
      // Not connected — read from app_parameters DB
      const row = await appParametersRepository.getRow('lastTrim');
      if (!row) return null;
      const trimValue = parseInt(row.value, 10);
      if (isNaN(trimValue)) return null;
      return { trimValue, r24Timestamp: null };
    },
    staleTime: 30_000,
  });
}
