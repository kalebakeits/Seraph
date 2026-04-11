import { useEffect, useRef, useState } from 'react';

export function useWorkoutTimer(isRunning: boolean, startTs: number | null): number {
  const [elapsedMs, setElapsedMs] = useState(0);
  const pausedAt = useRef<number | null>(null);
  const pausedAccum = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTs === null) {
      setElapsedMs(0);
      pausedAccum.current = 0;
      pausedAt.current = null;
      return;
    }

    if (isRunning) {
      // If we were paused, accumulate the paused duration
      if (pausedAt.current !== null) {
        pausedAccum.current += Date.now() - pausedAt.current;
        pausedAt.current = null;
      }
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTs - pausedAccum.current);
      }, 1000);
    } else {
      // Pausing
      pausedAt.current ??= Date.now();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, startTs]);

  return elapsedMs;
}
