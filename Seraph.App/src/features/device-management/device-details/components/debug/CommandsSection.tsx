import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { sql, gte } from 'drizzle-orm';
import { SafeText } from '../../../../../components/common/SafeText';
import { ActionRow } from '../ActionRow';
import { theme } from '../../../../../theme';
import { getDb } from '../../../../../services/database/drizzle/db';
import { r24 } from '../../../../../services/database/drizzle/schema';
import {
  nativeVibrate,
  nativeHaptic,
  nativeAbortSync,
  nativeSyncNow,
  nativeReaggregate,
} from '../../../../../services/ble/nativeModule';
import { errorMessage } from '../../../../../utils/errorUtils';

export const CommandsSection: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [oldestDate, setOldestDate] = useState<Date | undefined>(undefined);

  const handlePing = async () => {
    try {
      await nativeVibrate();
    } catch {}
  };
  const handleHaptic = async () => {
    try {
      await nativeHaptic();
    } catch {}
  };

  const handleRequestSync = async () => {
    try {
      await nativeSyncNow();
    } catch (e) {
      Alert.alert(t('device.debug.syncError'), errorMessage(e));
    }
  };

  const handleAbortSync = async () => {
    try {
      await nativeAbortSync();
    } catch {}
  };

  const handleReaggregate = () => {
    void getDb()
      .select({ oldest: sql<string>`date(MIN(${r24.timestamp}) / 1000, 'unixepoch')` })
      .from(r24)
      .then(rows => {
        const row = rows[0];
        if (row.oldest) setOldestDate(new Date(row.oldest));
        setShowDatePicker(true);
      });
  };

  const handleReaggregateFrom = (fromDate: Date) => {
    const fromTs = fromDate.getTime();
    void getDb()
      .selectDistinct({ date: sql<string>`date(${r24.timestamp} / 1000, 'unixepoch')` })
      .from(r24)
      .where(gte(r24.timestamp, fromTs))
      .then(async rows => {
        const dates = rows.map(r => r.date).filter(Boolean);
        if (dates.length > 0) {
          await nativeAbortSync();
          await nativeReaggregate(dates);
          await queryClient.invalidateQueries();
        }
      })
      .catch((e: unknown) => {
        Alert.alert(t('device.debug.reaggError'), errorMessage(e));
      });
  };

  return (
    <>
      <SafeText style={styles.sectionTitle}>{t('device.debug.commands')}</SafeText>
      <View style={styles.card}>
        <ActionRow
          icon="radio-button-on"
          label={t('device.debug.ping')}
          onPress={() => void handlePing()}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="hand-left"
          label={t('device.debug.haptic')}
          onPress={() => void handleHaptic()}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="sync"
          label={t('device.debug.requestSync')}
          onPress={() => void handleRequestSync()}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="stop-circle"
          label={t('device.debug.abortSync')}
          onPress={() => void handleAbortSync()}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="reload-circle"
          label={t('device.debug.reAggregate')}
          sublabel={t('device.debug.reAggregateHint')}
          onPress={handleReaggregate}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display="spinner"
          value={new Date()}
          minimumDate={oldestDate}
          maximumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) handleReaggregateFrom(date);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  card: {
    ...theme.cardStyles.default,
    padding: 0,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.overlay.light,
    marginLeft: 52,
  },
});
