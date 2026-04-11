import { useQuery } from '@tanstack/react-query';
import type { CachedDevice } from '../../../services/ble/DeviceCache';
import { DeviceCache } from '../../../services/ble/DeviceCache';

export function useCachedDevice() {
  return useQuery({
    queryKey: ['cachedDevice'],
    queryFn: async (): Promise<CachedDevice | null> => {
      return await DeviceCache.getDevice();
    },
    staleTime: Infinity,
  });
}
