import { useCallback, useEffect, useState } from 'react';
import { appParametersRepository } from '../../../services/database/drizzle/repositories/appParametersRepository';

const DEFAULT_Z1_SECONDS = 90;

export interface AutoPauseSettings {
  enabled: boolean;
  z1Seconds: number;
  fthr: number | null;
}

export function useAutoPauseSettings() {
  const [settings, setSettings] = useState<AutoPauseSettings>({
    enabled: false,
    z1Seconds: DEFAULT_Z1_SECONDS,
    fthr: null,
  });

  useEffect(() => {
    void (async () => {
      const [enabled, z1, fthr] = await Promise.all([
        appParametersRepository.get('recording_auto_pause_enabled'),
        appParametersRepository.getNumeric('recording_auto_pause_z1_seconds'),
        appParametersRepository.getNumeric('profile_threshold_hr'),
      ]);
      setSettings({
        enabled: enabled === '1',
        z1Seconds: z1 ?? DEFAULT_Z1_SECONDS,
        fthr: fthr,
      });
    })();
  }, []);

  const setEnabled = useCallback(async (value: boolean) => {
    await appParametersRepository.set('recording_auto_pause_enabled', value ? '1' : '0');
    setSettings(s => ({ ...s, enabled: value }));
  }, []);

  const setZ1Seconds = useCallback(async (value: number) => {
    await appParametersRepository.set('recording_auto_pause_z1_seconds', value);
    setSettings(s => ({ ...s, z1Seconds: value }));
  }, []);

  return { settings, setEnabled, setZ1Seconds };
}
