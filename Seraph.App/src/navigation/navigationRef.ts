import { createNavigationContainerRef } from '@react-navigation/native';
import type { HomeStackParamList } from './HomeStackNavigator';

export const navigationRef = createNavigationContainerRef<HomeStackParamList>();

export function navigateFromDeepLink(url: string) {
  if (!navigationRef.isReady()) return;
  const workoutMatch = /^seraph:\/\/workout\/(\d+)$/.exec(url);
  if (workoutMatch) {
    navigationRef.navigate('WorkoutDetail', { activityId: parseInt(workoutMatch[1], 10) });
    return;
  }
  const sleepMatch = /^seraph:\/\/sleep\/(\d+)$/.exec(url);
  if (sleepMatch) {
    navigationRef.navigate('SleepSessionDetail', { sleepId: parseInt(sleepMatch[1], 10) });
    return;
  }
  if (url === 'seraph://wakeup') {
    navigationRef.navigate('WakeUp');
  }
}
