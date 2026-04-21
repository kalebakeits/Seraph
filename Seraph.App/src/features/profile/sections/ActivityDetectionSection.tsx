import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { buildSectionStyles } from '../../../theme/shared/SectionStyles';
import { useTheme, type Theme } from '../../../theme';
import { SENSITIVITY_PRESETS } from '../ProfileSettingsTypes';
import type { SensitivityPreset } from '../ProfileSettingsTypes';

interface Props {
  selected: SensitivityPreset;
  onSelect: (key: SensitivityPreset) => void;
}

export const ActivityDetectionSection: React.FC<Props> = ({ selected, onSelect }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.sensitivityHeader}>
        <SafeText style={[sectionStyles.sectionTitle, styles.sectionGap]}>
          {t('settings.activityDetection')}
        </SafeText>
      </View>
      <View style={sectionStyles.container}>
        {SENSITIVITY_PRESETS.map(preset => {
          const isSelected = selected === preset.key;
          const labelKey = `settings.sensitivity${preset.key
            .charAt(0)
            .toUpperCase()}${preset.key.slice(1)}`;
          const descKey = `${labelKey}Desc`;

          return (
            <TouchableOpacity
              key={preset.key}
              style={styles.sensitivityRow}
              onPress={() => {
                onSelect(preset.key);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.sensitivityLeft}>
                <SafeText
                  style={[styles.sensitivityLabel, isSelected && { color: theme.colors.strain }]}
                >
                  {t(labelKey)}
                </SafeText>
                <SafeText style={styles.sensitivityDesc}>{t(descKey)}</SafeText>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={theme.colors.strain}
                style={{ opacity: isSelected ? 1 : 0 }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    sectionGap: {
      marginTop: theme.spacing.lg,
    },
    sensitivityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sensitivityRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm + 2,
    },
    sensitivityLeft: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    sensitivityLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
    },
    sensitivityDesc: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      lineHeight: 18,
      paddingHorizontal: theme.spacing.xxs,
    },
  });
}
