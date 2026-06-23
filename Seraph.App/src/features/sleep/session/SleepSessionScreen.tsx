import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, ActivityIndicator, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../../components/common/ScreenLayout';
import { BlockingOverlay } from '../../../components/BlockingOverlay';
import { TimePicker } from '../../../components/TimePicker';
import { useTheme, type Theme } from '../../../theme';
import { reportError } from '../../../utils/reportError';
import { sleepEventsRepository } from '../../../services/database/drizzle/repositories/sleepEventsRepository';
import { nativeRecalcSleep } from '../../../services/ble/nativeModule';
import { dailyAggregationsRepository } from '../../../services/database/drizzle/repositories/dailyAggregationsRepository';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';
import { SleepSessionHeader } from './SleepSessionHeader';
import { SleepSessionEditBar } from './SleepSessionEditBar';
import { SleepHRCard } from './SleepHRCard';
import { SleepSessionHero } from './SleepSessionHero';
import { SleepSessionMetrics } from './SleepSessionMetrics';
import { applyTimeToDate } from '../../home/overview/sheets/activitySheetUtils';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../../utils/dateUtils';
import { useSleepSessionDetail } from '../hooks/useSleepSessionDetail';
import { useMarkNotificationRead } from '../../../hooks/useMarkNotificationRead';

type Props = NativeStackScreenProps<HomeStackParamList, 'SleepSessionDetail'>;

export const SleepSessionScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { sleepId } = route.params;
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading } = useSleepSessionDetail(sleepId);
  useMarkNotificationRead('sleep', sleepId);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const originalStart = useRef(new Date());
  const originalEnd = useRef(new Date());
  const [editing, setEditing] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const start = new Date(data.session.start_ts);
    const end = new Date(data.session.end_ts);
    setStartDate(start);
    setEndDate(end);
    originalStart.current = start;
    originalEnd.current = end;
  }, [data]);

  const dirty =
    startDate.getTime() !== originalStart.current.getTime() ||
    endDate.getTime() !== originalEnd.current.getTime();

  const handleStartConfirm = (picker: Date) => {
    // Apply picked time to the original start date to avoid compounding ±24h adjustments.
    let s = applyTimeToDate(originalStart.current, picker);
    if (s >= endDate) s = new Date(s.getTime() - 24 * 60 * 60 * 1000);
    setStartDate(s);
    setStartPickerOpen(false);
  };

  const handleEndConfirm = (picker: Date) => {
    // Apply picked time to the original end date, then anchor relative to current start.
    let e = applyTimeToDate(originalEnd.current, picker);
    if (e <= startDate) e = new Date(e.getTime() + 24 * 60 * 60 * 1000);
    setEndDate(e);
    setEndPickerOpen(false);
  };

  const handleSave = async () => {
    if (saving || !dirty || !data) return;
    setSaving(true);
    try {
      const startTs = startDate.getTime();
      const endTs = endDate.getTime();
      await sleepEventsRepository.update(sleepId, startTs, endTs);
      void nativeRecalcSleep(sleepId);
      void queryClient.invalidateQueries({ queryKey: ['recentSleep'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      void queryClient.invalidateQueries({ queryKey: ['activityStats'] });
      navigation.goBack();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === 'OVERLAP_SLEEP') {
        Alert.alert(t('sleep.overlapTitle'), t('sleep.overlapMessage'));
      } else {
        reportError(e, 'sleep', 'saveSleepSession');
      }
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (saving || !data) return;
    setSaving(true);
    try {
      const { session } = data;

      // Find next candidate before deleting so we know if this was primary.
      // Primary = earliest end_ts on the date.
      const nextSleep = await sleepEventsRepository.getEarliestByEndTs(session.date, sleepId);
      const isPrimary = nextSleep === null || session.end_ts <= nextSleep.end_ts;

      await sleepEventsRepository.delete(sleepId);

      if (isPrimary) {
        if (nextSleep !== null) {
          // Promote next sleep to primary: recalcSleep resets finalized + accumulators
          // then replays the window, writing recovery/RHR/HRV to daily_agg.
          void nativeRecalcSleep(nextSleep.id);
        } else {
          // No remaining sleep on this date — clear recovery fields.
          void dailyAggregationsRepository.clearRecovery(session.date);
        }
      }

      void queryClient.invalidateQueries({ queryKey: ['recentSleep'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      void queryClient.invalidateQueries({ queryKey: ['activityStats'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      navigation.goBack();
    } catch (e) {
      reportError(e, 'sleep', 'deleteSleepSession');
      setSaving(false);
    }
  };

  if (isLoading || !data) {
    return (
      <ScreenLayout>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.sleep} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <SleepSessionHeader
        date={data.session.date}
        editing={editing}
        onEditPress={() => {
          setEditing(e => !e);
        }}
        onDeletePress={() => {
          void handleDelete();
        }}
        disabled={saving}
      />

      {editing && (
        <SleepSessionEditBar
          startLabel={formatTime(startDate.getTime())}
          endLabel={formatTime(endDate.getTime())}
          dirty={dirty}
          saving={saving}
          onStartPress={() => {
            setStartPickerOpen(true);
          }}
          onEndPress={() => {
            setEndPickerOpen(true);
          }}
          onSave={() => {
            void handleSave();
          }}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <SleepSessionHero
          durationMinutes={data.session.duration_minutes}
          startTs={data.session.start_ts}
          endTs={data.session.end_ts}
          quality={data.quality}
        />
        <SleepSessionMetrics
          avgHr={data.session.avg_hr ?? null}
          hrv={data.session.hrv_rmssd ?? null}
          rhr={data.rhr}
          awakeMinutes={data.session.awake_minutes}
          anchorDate={data.session.date}
        />
        <SleepHRCard
          hrPoints={data.hrPoints}
          awakeRuns={data.awakeRuns}
          avgHr={data.session.avg_hr ?? null}
        />
      </ScrollView>

      <TimePicker
        time={startDate}
        onTimeChange={setStartDate}
        open={startPickerOpen}
        onConfirm={handleStartConfirm}
        onCancel={() => {
          setStartPickerOpen(false);
        }}
        mode="datetime"
      />

      <TimePicker
        time={endDate}
        onTimeChange={setEndDate}
        open={endPickerOpen}
        onConfirm={handleEndConfirm}
        onCancel={() => {
          setEndPickerOpen(false);
        }}
        mode="datetime"
      />

      <BlockingOverlay visible={saving} />
    </ScreenLayout>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { gap: theme.spacing.md },
  });
}
