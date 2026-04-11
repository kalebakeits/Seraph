import React, { useRef, useState } from 'react';
import { Animated, View, StyleSheet, PanResponder, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityRings } from './components/ActivityRings';
import { DailyStats } from './components/DailyStats';
import { ActivitiesCard } from './components/ActivitiesCard';
import { CompactRingsBar } from './components/CompactRingsBar';
import { ActivityHighlight } from './components/ActivityHighlight';
import { theme } from '../../../theme';
import { WakeUpTimeCard } from '../../wake-up-time/WakeUpTimeCard';
import { useWithinWindDown } from '../hooks/useShowWakeUpTime';
import { useActivityHighlight } from '../hooks/useActivityHighlight';
import { useActivities } from '../hooks/useActivities';
import { useActivityRings } from '../hooks/useActivityRings';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';
import { ActivityType } from '../../../types/ActivityType';
import { StressTimelineCard } from './components/StressTimelineCard';
import { Section } from '../../../components/common/Section';
import { todayISO } from '../../../utils/dateUtils';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

interface OverviewTabProps {
  selectedDate?: string;
  onActivityPress?: (id: number, type: ActivityType) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  selectedDate,
  onActivityPress,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { t } = useTranslation();
  const { withinWindDown } = useWithinWindDown();
  const isToday = !selectedDate || selectedDate === todayISO();

  const { data: activities = [] } = useActivities(isToday ? undefined : selectedDate);
  const { highlighted, dismiss: dismissHighlight } = useActivityHighlight(
    isToday ? activities : [],
  );

  const { data: rings } = useActivityRings(selectedDate);
  const navigation = useNavigation<NavigationProp>();

  const scrollY = useRef(new Animated.Value(0)).current;
  const [ringsHeight, setRingsHeight] = useState(160);
  const [showCompact, setShowCompact] = useState(false);

  const strain = rings?.strain ?? { value: null, goal: 21 };
  const recovery = rings?.recovery ?? { value: null, goal: 100 };
  const sleep = rings?.sleep ?? { value: null, goal: 100 };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) onSwipeLeft?.();
        else if (g.dx > 40) onSwipeRight?.();
      },
    }),
  ).current;

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
    listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = event.nativeEvent.contentOffset.y;
      setShowCompact(y > ringsHeight);
    },
  });

  return (
    <View style={styles.wrapper} {...panResponder.panHandlers}>
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View
          onLayout={e => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) setRingsHeight(h);
          }}
        >
          <ActivityRings selectedDate={selectedDate} rings={rings} />
        </View>

        <ActivityHighlight
          highlighted={highlighted}
          selectedDate={selectedDate}
          onDismiss={dismissHighlight}
          onNavigate={(id, type) => {
            if (type === ActivityType.Workout)
              navigation.navigate('WorkoutDetail', { activityId: id, selectedDate });
            else navigation.navigate('SleepSessionDetail', { sleepId: id, selectedDate });
          }}
        />

        {isToday && withinWindDown && (
          <Section title={t('nav.wakeUpTime')}>
            <WakeUpTimeCard />
          </Section>
        )}

        <ActivitiesCard selectedDate={selectedDate} onActivityPress={onActivityPress} />
        <DailyStats selectedDate={selectedDate} />

        {isToday && !withinWindDown && (
          <Section title={t('nav.wakeUpTime')}>
            <WakeUpTimeCard />
          </Section>
        )}

        <StressTimelineCard selectedDate={selectedDate} />
      </Animated.ScrollView>
      {showCompact && (
        <CompactRingsBar
          strain={strain}
          recovery={recovery}
          sleep={sleep}
          onStrainPress={() => {
            navigation.navigate('Strain', { selectedDate });
          }}
          onRecoveryPress={() => {
            navigation.navigate('Recovery', { selectedDate });
          }}
          onSleepPress={() => {
            navigation.navigate('Sleep', { selectedDate });
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: {
    ...(theme.tabStyles.container as ViewStyle),
  },
  content: {
    ...(theme.tabStyles.content as ViewStyle),
  },
});
