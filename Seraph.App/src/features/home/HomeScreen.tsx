import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OverviewTab } from './overview/OverviewTab';
import { HomeHeader } from './components/HomeHeader';
import { CalendarModal } from './components/CalendarModal';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useDeviceStore } from '../device-management/store/deviceStore';
import { DeviceState } from '../device-management/types/DeviceState';
import { useLastSynced } from '../../hooks/useLastSynced';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { todayISO, addDaysISO } from '../../utils/dateUtils';
import { ActivityType } from '../../types/ActivityType';
import { useNapState } from '../nap/hooks/useNapState';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isConnected, isConnecting, isSyncing, isAggregating, battery } = useDeviceStore();
  const lastSynced = useLastSynced();
  const unreadCount = useUnreadCount();
  const { napState } = useNapState();

  useFocusEffect(
    React.useCallback(() => {
      if (napState.active) {
        navigation.navigate('NapActive');
      }
    }, [napState.active, navigation]),
  );

  let deviceState: DeviceState;
  if (isSyncing) {
    deviceState = DeviceState.Syncing;
  } else if (isAggregating) {
    deviceState = DeviceState.Aggregating;
  } else if (isConnecting) {
    deviceState = DeviceState.Connecting;
  } else if (isConnected) {
    deviceState = DeviceState.Connected;
  } else {
    deviceState = DeviceState.Disconnected;
  }

  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDateSelect = (date: string) => {
    if (date <= today) setSelectedDate(date);
    setCalendarOpen(false);
  };

  const handlePrevDay = () => {
    setSelectedDate(d => addDaysISO(d, -1));
  };
  const handleNextDay = () => {
    setSelectedDate(d => {
      const next = addDaysISO(d, 1);
      return next <= today ? next : d;
    });
  };

  return (
    <View style={styles.container}>
      <HomeHeader
        deviceState={deviceState}
        battery={battery}
        lastSynced={lastSynced}
        unreadCount={unreadCount}
        selectedDate={selectedDate}
        today={today}
        onDevicePress={() => {
          navigation.navigate('DeviceManagement');
        }}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onDatePress={() => {
          setCalendarOpen(true);
        }}
        onBellPress={() => {
          navigation.navigate('NotificationCenter');
        }}
      />

      <OverviewTab
        selectedDate={selectedDate}
        onActivityPress={(id, type) => {
          if (type === ActivityType.Sleep) {
            navigation.navigate('SleepSessionDetail', { sleepId: id, selectedDate });
          } else {
            navigation.navigate('WorkoutDetail', { activityId: id, selectedDate });
          }
        }}
        onSwipeLeft={handleNextDay}
        onSwipeRight={handlePrevDay}
      />

      <CalendarModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        maxDate={today}
        onSelect={handleDateSelect}
        onClose={() => {
          setCalendarOpen(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
