import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';

interface LiveHRDisplayProps {
  hr: number | null;
  zone: 1 | 2 | 3 | 4 | 5 | null;
  zoneColor: string;
}

const ZONE_NAME_KEYS = ['z1Name', 'z2Name', 'z3Name', 'z4Name', 'z5Name'] as const;

export const LiveHRDisplay: React.FC<LiveHRDisplayProps> = ({ hr, zone, zoneColor }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const zoneName = zone !== null ? t(`workout.${ZONE_NAME_KEYS[zone - 1]}`) : null;

  return (
    <View style={styles.container}>
      <View
        style={[styles.pill, { borderColor: hr !== null ? zoneColor : theme.colors.overlay.light }]}
      >
        <SafeText
          style={[styles.hrValue, { color: hr !== null ? zoneColor : theme.colors.text.muted }]}
        >
          {hr !== null ? String(hr) : '---'}
        </SafeText>
        <SafeText style={styles.bpmLabel}>{hr !== null ? t('common.bpm') : ''}</SafeText>
      </View>
      {zoneName !== null && (
        <View style={[styles.zoneBadge, { backgroundColor: `${zoneColor}22` }]}>
          <SafeText style={[styles.zoneName, { color: zoneColor }]}>
            {`Z${String(zone)} · ${zoneName}`}
          </SafeText>
        </View>
      )}
    </View>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: theme.spacing.sm + theme.spacing.xxs,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderWidth: theme.borderWidth.medium,
      borderRadius: 28,
      paddingHorizontal: 28,
      paddingVertical: 12,
      gap: theme.spacing.smx,
    },
    hrValue: {
      fontSize: 80,
      fontWeight: '700',
      lineHeight: 88,
      letterSpacing: -2,
    },
    bpmLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.muted,
      marginBottom: 14,
    },
    zoneBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.smx,
      borderRadius: theme.borderRadius.full,
    },
    zoneName: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
    },
  });
}
