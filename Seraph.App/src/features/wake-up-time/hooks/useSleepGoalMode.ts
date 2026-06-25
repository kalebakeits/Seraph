import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { appParametersRepository } from '../../../services/database/drizzle/repositories/appParametersRepository';
import { nativeRecalculateCurrentSleepNeed } from '../../../services/ble/nativeModule';
import type { SleepGoalMode } from '../../profile/ProfileSettingsTypes';

export const SLEEP_GOAL_MODE_KEY = ['sleepGoalMode'];
const DEFAULT_SLEEP_GOAL_MODE: SleepGoalMode = 'adaptive';
const SAVE_DELAY_MS = 800;

export function useSleepGoalMode() {
  const queryClient = useQueryClient();
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: mode = DEFAULT_SLEEP_GOAL_MODE } = useQuery({
    queryKey: SLEEP_GOAL_MODE_KEY,
    queryFn: async (): Promise<SleepGoalMode> => {
      const saved = await appParametersRepository.get('profile_sleep_goal_mode');
      return saved === 'fixed' ? 'fixed' : DEFAULT_SLEEP_GOAL_MODE;
    },
  });

  useEffect(
    () => () => {
      if (saveRef.current) {
        clearTimeout(saveRef.current);
      }
    },
    [],
  );

  const setSleepGoalMode = useCallback(
    (nextMode: SleepGoalMode) => {
      queryClient.setQueryData(SLEEP_GOAL_MODE_KEY, nextMode);

      if (saveRef.current) {
        clearTimeout(saveRef.current);
      }

      saveRef.current = setTimeout(() => {
        void (async () => {
          await appParametersRepository.set('profile_sleep_goal_mode', nextMode);
          await nativeRecalculateCurrentSleepNeed().catch(() => {
            // best-effort; native aggregation will refresh on the next sync
          });
          void queryClient.invalidateQueries({ queryKey: ['sleepNeedFactors'] });
        })();
      }, SAVE_DELAY_MS);
    },
    [queryClient],
  );

  return { mode, setSleepGoalMode };
}
