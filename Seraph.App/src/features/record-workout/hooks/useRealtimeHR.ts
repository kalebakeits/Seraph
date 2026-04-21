import { useEffect, useRef, useState } from 'react';
import {
  nativeToggleRealtimeHR,
  nativeGetRecordingState,
  seraphEmitter,
} from '../../../services/ble/nativeModule';
import { theme } from '../../../theme';
import { getEffectiveFthr } from '../../../utils/hrThreshold';

const HR_STALE_MS = 10_000;

export interface RealtimeHRState {
  hr: number | null;
  stale: boolean;
  zone: 1 | 2 | 3 | 4 | 5 | null;
  zoneColor: string;
}

function calcZone(hr: number, fthr: number): 1 | 2 | 3 | 4 | 5 {
  if (hr < fthr * 0.72) return 1;
  if (hr < fthr * 0.83) return 2;
  if (hr < fthr * 0.94) return 3;
  if (hr < fthr * 1.05) return 4;
  return 5;
}

export function useRealtimeHR(fthr: number | null, age: number | null): RealtimeHRState {
  const [hr, setHr] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const lastPacketTs = useRef(0);
  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void nativeToggleRealtimeHR(true);
    return () => {
      // Don't disable realtime HR if a recording is still in progress —
      // the native side needs it to keep writing to the file while backgrounded.
      void nativeGetRecordingState()
        .then(s => {
          if (s.state === 'idle') void nativeToggleRealtimeHR(false);
        })
        .catch(() => {
          void nativeToggleRealtimeHR(false);
        });
    };
  }, []);

  useEffect(() => {
    const sub = seraphEmitter.addListener('onRealtimeHR', (event: { hr: number }) => {
      const incoming = event.hr;
      if (incoming <= 0 || incoming > 220) return;
      lastPacketTs.current = Date.now();
      setHr(incoming);
      setStale(false);

      if (staleTimer.current) clearTimeout(staleTimer.current);
      staleTimer.current = setTimeout(() => {
        setStale(true);
        setHr(null);
      }, HR_STALE_MS);
    });

    return () => {
      sub.remove();
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, []);

  const zone = hr !== null ? calcZone(hr, getEffectiveFthr(fthr, age)) : null;
  const zoneColor = zone !== null ? theme.colors.zones[zone - 1] : theme.colors.text.muted;

  return { hr, stale, zone, zoneColor };
}
