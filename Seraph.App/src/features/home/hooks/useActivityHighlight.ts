import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActivityItem } from './useActivities';

const STORAGE_KEY = 'activityHighlight_dismissed';

/**
 * Given today's activity list, shows the most recent auto-detected activity
 * that hasn't been dismissed. Dismissed keys are persisted as a set so
 * dismissing a workout reveals sleep beneath it (stack behaviour).
 * Manual activities are never highlighted.
 */
export function useActivityHighlight(activities: ActivityItem[]) {
  const [dismissed, setDismissed] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v) {
        try {
          setDismissed(new Set(JSON.parse(v) as unknown[]));
        } catch {
          /* ignore malformed storage */
        }
      }
      setLoaded(true);
    });
  }, []);

  const candidate =
    [...activities]
      .sort((a, b) => b.end_ts - a.end_ts)
      .find(item => {
        if (item.isManual) return false;
        const key = `${item.type}-${String(item.id)}-${String(item.end_ts)}`;
        return !dismissed.has(key);
      }) ?? null;

  const candidateKey = candidate
    ? `${candidate.type}-${String(candidate.id)}-${String(candidate.end_ts)}`
    : null;
  const highlighted = loaded ? candidate : null;

  const dismiss = useCallback(() => {
    if (!candidateKey) return;
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(candidateKey);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, [candidateKey]);

  return { highlighted, dismiss };
}
