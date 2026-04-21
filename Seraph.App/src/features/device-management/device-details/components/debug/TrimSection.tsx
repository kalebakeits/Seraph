import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { SafeText } from '../../../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../../../theme';
import { nativeForceTrim } from '../../../../../services/ble/nativeModule';
import { errorMessage } from '../../../../../utils/errorUtils';

interface Props {
  lastTrim: { trimValue: number; r24Timestamp: number | null } | null | undefined;
}

export const TrimSection: React.FC<Props> = ({ lastTrim }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [forceTrimInput, setForceTrimInput] = useState('');

  const r24TsLabel = lastTrim?.r24Timestamp
    ? new Date(lastTrim.r24Timestamp).toLocaleString(i18n.language)
    : '--';

  const handleForceTrim = () => {
    const val = parseInt(forceTrimInput, 10);
    if (isNaN(val)) {
      Alert.alert(t('device.debug.invalidTrim'));
      return;
    }
    Alert.alert(
      t('device.debug.forceTrimTitle'),
      t('device.debug.forceTrimConfirm', { value: val }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('device.debug.forceTrimAction'),
          style: 'destructive',
          onPress: () => {
            void nativeForceTrim(val)
              .then(() => queryClient.invalidateQueries({ queryKey: ['lastTrim'] }))
              .catch((e: unknown) => {
                Alert.alert(t('device.debug.forceTrimError'), errorMessage(e));
              });
          },
        },
      ],
    );
  };

  return (
    <>
      <SafeText style={styles.sectionTitle}>{t('device.debug.trimInfo')}</SafeText>
      <View style={styles.card}>
        <View style={styles.row}>
          <SafeText style={styles.label}>{t('device.debug.lastTrimValue')}</SafeText>
          <SafeText style={styles.value}>
            {lastTrim != null ? lastTrim.trimValue.toString() : '--'}
          </SafeText>
        </View>
        <View style={styles.row}>
          <SafeText style={styles.label}>{t('device.debug.lastTrimTs')}</SafeText>
          <SafeText style={[styles.value, styles.valueMono]}>{r24TsLabel}</SafeText>
        </View>
      </View>

      <SafeText style={styles.sectionTitle}>{t('device.debug.forceTrimSection')}</SafeText>
      <View style={styles.card}>
        <SafeText style={styles.trimHint}>{t('device.debug.forceTrimHint')}</SafeText>
        <View style={styles.forceTrimRow}>
          <TextInput
            style={styles.trimInput}
            value={forceTrimInput}
            onChangeText={setForceTrimInput}
            placeholder={
              lastTrim != null ? lastTrim.trimValue.toString() : t('device.debug.trimPlaceholder')
            }
            placeholderTextColor={theme.colors.text.muted}
            keyboardType="number-pad"
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.forceTrimBtn}
            onPress={handleForceTrim}
            activeOpacity={0.7}
          >
            <SafeText style={styles.forceTrimBtnText}>{t('device.debug.forceTrimAction')}</SafeText>
          </TouchableOpacity>
        </View>
      </View>
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
    valueMono: {
      fontFamily: 'monospace',
      fontSize: theme.typography.sizes.xs,
    },
    trimHint: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      padding: theme.spacing.md,
      paddingBottom: 0,
    },
    forceTrimRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
    },
    trimInput: {
      flex: 1,
      backgroundColor: theme.colors.overlay.light,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.primary,
      fontFamily: 'monospace',
    },
    forceTrimBtn: {
      backgroundColor: theme.colors.error + '22',
      borderWidth: 1,
      borderColor: theme.colors.error + '44',
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    forceTrimBtnText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.error,
    },
  });
}
