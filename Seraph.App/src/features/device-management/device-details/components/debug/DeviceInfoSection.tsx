import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { SafeText } from '../../../../../components/common/SafeText';
import { theme } from '../../../../../theme';

interface Props {
  clock: Date | null;
  alarm: Date | null;
  onWrist: boolean | undefined;
  firmwareVersion: string | undefined;
  hardwareVersion: string | undefined;
}

export const DeviceInfoSection: React.FC<Props> = ({
  clock,
  alarm,
  onWrist,
  firmwareVersion,
  hardwareVersion,
}) => {
  const { t, i18n } = useTranslation();

  let onWristLabel = '--';
  if (onWrist === true) onWristLabel = t('device.onWrist');
  else if (onWrist === false) onWristLabel = t('device.offWrist');

  return (
    <>
      <SafeText style={styles.sectionTitle}>{t('device.debug.deviceInfo')}</SafeText>
      <View style={styles.card}>
        {firmwareVersion && (
          <View style={styles.row}>
            <SafeText style={styles.label}>Harvard</SafeText>
            <SafeText style={styles.value}>{firmwareVersion}</SafeText>
          </View>
        )}
        {hardwareVersion && (
          <View style={styles.row}>
            <SafeText style={styles.label}>Boylston</SafeText>
            <SafeText style={styles.value}>{hardwareVersion}</SafeText>
          </View>
        )}
        <View style={styles.row}>
          <SafeText style={styles.label}>{t('device.debug.onWrist')}</SafeText>
          <SafeText style={styles.value}>{onWristLabel}</SafeText>
        </View>
        <View style={styles.row}>
          <SafeText style={styles.label}>{t('device.debug.deviceClock')}</SafeText>
          <SafeText style={styles.value}>
            {clock ? clock.toLocaleString(i18n.language) : '--'}
          </SafeText>
        </View>
        <View style={styles.row}>
          <SafeText style={styles.label}>{t('device.debug.alarm')}</SafeText>
          <SafeText style={styles.value}>
            {alarm ? alarm.toLocaleString(i18n.language) : '--'}
          </SafeText>
        </View>
        <View style={styles.row}>
          <SafeText style={styles.label}>{t('device.debug.appVersion')}</SafeText>
          <SafeText style={styles.value}>{Constants.expoConfig?.version ?? '--'}</SafeText>
        </View>
      </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  value: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    maxWidth: '55%',
    textAlign: 'right',
  },
});
