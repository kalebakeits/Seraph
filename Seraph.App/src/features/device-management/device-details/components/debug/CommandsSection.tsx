import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeText } from '../../../../../components/common/SafeText';
import { ActionRow } from '../ActionRow';
import { useTheme, type Theme } from '../../../../../theme';
import {
  nativeVibrate,
  nativeHaptic,
  nativeAbortSync,
  nativeSyncNow,
  nativeReaggregate,
} from '../../../../../services/ble/nativeModule';
import { errorMessage } from '../../../../../utils/errorUtils';

export const CommandsSection: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoadingOldest, setIsLoadingOldest] = useState(false);

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

  const handleReaggregate = async () => {
    if (isLoadingOldest) return;
    setIsLoadingOldest(true);
    try {
      await nativeAbortSync();
      setShowDatePicker(true);
    } catch (e: unknown) {
      Alert.alert(t('device.debug.reaggError'), errorMessage(e));
    } finally {
      setIsLoadingOldest(false);
    }
  };

  const handleReaggregateFrom = async (fromDate: Date) => {
    try {
      const dates: string[] = [];
      const cursor = new Date(fromDate);
      const today = new Date();
      while (cursor <= today) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setDate(cursor.getDate() + 1);
      }
      if (dates.length === 0) return;
      await nativeAbortSync();
      await nativeReaggregate(dates);
    } catch (e: unknown) {
      Alert.alert(t('device.debug.reaggError'), errorMessage(e));
    }
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
          onPress={() => void handleReaggregate()}
          loading={isLoadingOldest}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display="spinner"
          value={new Date()}
          maximumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) void handleReaggregateFrom(date);
          }}
        />
      )}
    </>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
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
}
