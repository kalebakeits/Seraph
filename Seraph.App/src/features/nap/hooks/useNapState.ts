import { useQuery } from '@tanstack/react-query';
import { nativeGetNapState, type NapState } from '../../../services/ble/nativeModule';

const INACTIVE: NapState = { active: false, targetMs: null, hardCutoffSec: null, mode: null };

export function useNapState() {
  const { data, refetch } = useQuery<NapState>({
    queryKey: ['napState'],
    queryFn: async () => {
      try {
        return await nativeGetNapState();
      } catch {
        return INACTIVE;
      }
    },
    refetchInterval: 5000,
    initialData: INACTIVE,
  });

  return { napState: data, refetchNapState: refetch };
}
