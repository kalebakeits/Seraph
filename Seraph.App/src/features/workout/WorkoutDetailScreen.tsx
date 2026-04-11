import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SkiaHRChart } from '../../components/common/SkiaHRChart';
import { Section } from '../../components/common/Section';
import { SafeText } from '../../components/common/SafeText';
import { sectionStyles } from '../../theme/shared/SectionStyles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { BlockingOverlay } from '../../components/BlockingOverlay';
import { TimePicker } from '../../components/TimePicker';
import { theme } from '../../theme';
import { activityEventsRepository } from '../../services/database/drizzle/repositories/activityEventsRepository';
import { nativeRecalcActivity, nativeRefreshDailyLoad } from '../../services/ble/nativeModule';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutEditBar } from './WorkoutEditBar';
import { WorkoutZonesCard } from './WorkoutZonesCard';
import { useWorkoutDetail } from './hooks/useWorkoutDetail';
import { useMarkNotificationRead } from '../../hooks/useMarkNotificationRead';
import { applyTimeToDate } from '../home/overview/sheets/activitySheetUtils';
import { formatDuration } from '../../utils/dateUtils';

type Props = NativeStackScreenProps<HomeStackParamList, 'WorkoutDetail'>;

function formatDateTime(_iso: string, ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const WorkoutDetailScreen: React.FC<Props> = ({ route }) => {
  const { activityId } = route.params;
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const detail = useWorkoutDetail(activityId);
  useMarkNotificationRead('activity', activityId);
  const [editing, setEditing] = useState(false);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty =
    detail.startDate.getTime() !== detail.originalStart.current.getTime() ||
    detail.endDate.getTime() !== detail.originalEnd.current.getTime();

  const handleStartConfirm = (picker: Date) => {
    let s = applyTimeToDate(detail.startDate, picker);
    if (s >= detail.endDate) s = new Date(s.getTime() - 24 * 60 * 60 * 1000);
    detail.setStartDate(s);
    setStartPickerOpen(false);
  };

  const handleEndConfirm = (picker: Date) => {
    let e = applyTimeToDate(detail.endDate, picker);
    if (e <= detail.startDate) e = new Date(e.getTime() + 24 * 60 * 60 * 1000);
    detail.setEndDate(e);
    setEndPickerOpen(false);
  };

  const handleSave = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    try {
      const startTs = detail.startDate.getTime();
      const endTs = detail.endDate.getTime();
      await activityEventsRepository.update(activityId, startTs, endTs);
      void nativeRecalcActivity(activityId);
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      void queryClient.invalidateQueries({ queryKey: ['activityStats'] });
      void queryClient.invalidateQueries({ queryKey: ['strainDetail'] });
      navigation.goBack();
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === 'OVERLAP_ACTIVITY') {
        Alert.alert(t('workout.overlapTitle'), t('workout.overlapMessage'));
      } else {
        console.error('[WorkoutDetailScreen] save failed', e);
      }
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await activityEventsRepository.deleteById(activityId);
      void nativeRefreshDailyLoad(detail.date);
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      void queryClient.invalidateQueries({ queryKey: ['activityStats'] });
      void queryClient.invalidateQueries({ queryKey: ['strainDetail'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      navigation.goBack();
    } catch (e) {
      console.error('[WorkoutDetailScreen] delete failed', e);
      setSaving(false);
    }
  };

  if (detail.loading) {
    return (
      <ScreenLayout>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.active} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <WorkoutHeader
        date={formatDateTime(detail.date, detail.startDate.getTime())}
        editing={editing}
        onEditPress={() => {
          setEditing(e => !e);
        }}
        onDeletePress={() => void handleDelete()}
        disabled={saving}
      />
      {editing && (
        <WorkoutEditBar
          startLabel={detail.startDate.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
          endLabel={detail.endDate.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
          dirty={dirty}
          saving={saving}
          onStartPress={() => {
            setStartPickerOpen(true);
          }}
          onEndPress={() => {
            setEndPickerOpen(true);
          }}
          onSave={() => void handleSave()}
        />
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {detail.hrSamples.length > 0 && (
          <Section title={t('workout.heartRate')}>
            <View style={sectionStyles.container}>
              <SkiaHRChart
                data={detail.hrSamples}
                fthr={detail.thresholdHr}
                height={200}
                avgHr={detail.avgHr}
              />
              <View style={styles.statRows}>
                {detail.avgHr !== null && (
                  <View style={styles.statRow}>
                    <SafeText style={styles.statLabel}>{t('workout.avg')}</SafeText>
                    <SafeText style={styles.statValue}>
                      {t('workout.avgValue', { value: Math.round(detail.avgHr) })}
                    </SafeText>
                  </View>
                )}
                {detail.maxHr !== null && (
                  <View style={styles.statRow}>
                    <SafeText style={styles.statLabel}>{t('workout.max')}</SafeText>
                    <SafeText style={styles.statValue}>
                      {t('workout.maxValue', { value: Math.round(detail.maxHr) })}
                    </SafeText>
                  </View>
                )}
                <View style={styles.statRow}>
                  <SafeText style={styles.statLabel}>{t('workout.duration')}</SafeText>
                  <SafeText style={styles.statValue}>
                    {formatDuration(detail.endDate.getTime() - detail.startDate.getTime())}
                  </SafeText>
                </View>
              </View>
            </View>
          </Section>
        )}
        {detail.zoneSeconds && <WorkoutZonesCard zoneSeconds={detail.zoneSeconds} />}
      </ScrollView>

      <TimePicker
        time={detail.startDate}
        onTimeChange={detail.setStartDate}
        open={startPickerOpen}
        onConfirm={handleStartConfirm}
        onCancel={() => {
          setStartPickerOpen(false);
        }}
      />
      <TimePicker
        time={detail.endDate}
        onTimeChange={detail.setEndDate}
        open={endPickerOpen}
        onConfirm={handleEndConfirm}
        onCancel={() => {
          setEndPickerOpen(false);
        }}
      />
      <BlockingOverlay visible={saving} />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { gap: theme.spacing.md },
  statRows: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
  },
  statValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
});
