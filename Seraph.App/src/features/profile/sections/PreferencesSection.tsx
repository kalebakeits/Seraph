import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { theme } from '../../../theme';

interface Props {
  currentLangLabel: string;
  onShowLangPicker: () => void;
}

export const PreferencesSection: React.FC<Props> = ({ currentLangLabel, onShowLangPicker }) => {
  const { t } = useTranslation();

  return (
    <>
      <SafeText style={[sectionStyles.sectionTitle, styles.sectionGap]}>
        {t('settings.preferences')}
      </SafeText>
      <View style={sectionStyles.container}>
        <View style={styles.row}>
          <SafeText style={styles.rowLabel}>{t('settings.language')}</SafeText>
          <TouchableOpacity onPress={onShowLangPicker} activeOpacity={0.7} style={styles.rowRight}>
            <SafeText style={styles.rowValue}>{currentLangLabel}</SafeText>
            <Ionicons name="chevron-down" size={14} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionGap: {
    marginTop: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm + 2,
    minHeight: 44,
  },
  rowLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rowValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.primary,
  },
});
