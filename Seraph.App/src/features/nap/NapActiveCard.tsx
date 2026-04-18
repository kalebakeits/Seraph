import React, { useCallback, useMemo } from 'react';
import { Alert, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SafeText } from '../../components/common/SafeText';
import { useTheme, type Theme } from '../../theme';
import { appParametersRepository } from '../../services/database/drizzle/repositories/appParametersRepository';
import { nativeCancelNap } from '../../services/ble/nativeModule';
import { syncAlarmToDevice } from '../../services/alarm/syncAlarmToDevice';
import type { NapState } from '../../services/ble/nativeModule';
import { formatDuration } from '../../utils/dateUtils';

interface NapActiveCardProps {
  napState: NapState;
}

export const NapActiveCard: React.FC<NapActiveCardProps> = ({ napState }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const remainingSec = napState.hardCutoffSec
    ? Math.max(0, napState.hardCutoffSec - Math.floor(Date.now() / 1000))
    : null;

  const handleCancel = useCallback(() => {
    Alert.alert(t('nap.cancelTitle'), t('nap.cancelMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('nap.cancelConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await appParametersRepository.delete('nap_active_duration_ms');
              await appParametersRepository.delete('nap_hard_cutoff_sec');
              await appParametersRepository.delete('nap_mode');
              if (napState.mode === 'auto') {
                await nativeCancelNap();
              }
              await syncAlarmToDevice();
              void queryClient.invalidateQueries({ queryKey: ['napState'] });
              void queryClient.invalidateQueries({ queryKey: ['activities'] });
            } catch {
              // Silent — nap state will be cleaned up on next connect
            }
          })();
        },
      },
    ]);
  }, [t, queryClient, napState.mode]);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="moon" size={18} color={theme.colors.sleep} />
      </View>
      <View style={styles.content}>
        <SafeText style={styles.label}>
          {napState.mode === 'auto' ? t('nap.smartNapActive') : t('nap.simpleNapActive')}
        </SafeText>
        {remainingSec !== null && remainingSec > 0 && (
          <SafeText style={styles.sub}>
            {t('nap.cutoffIn', { time: formatDuration(remainingSec * 1000, 'minutes') })}
          </SafeText>
        )}
      </View>
      <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} activeOpacity={0.7}>
        <SafeText style={styles.cancelText}>{t('common.cancel')}</SafeText>
      </TouchableOpacity>
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.overlay.light,
      borderWidth: 1,
      borderColor: theme.colors.border.sleep.faint,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    iconWrap: {
      width: theme.layout.iconSize.sm,
      height: theme.layout.iconSize.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.overlay.medium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.sleep,
    },
    sub: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
    },
    cancelBtn: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border.sleep.medium,
    },
    cancelText: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.sleep,
      fontWeight: theme.typography.weights.semibold,
    },
  });
}
