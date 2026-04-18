import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { palettes, type ThemeName } from '../../theme/palettes';
import { PageContainer } from './PageContainer';
import { buildStyles } from './OnboardingStyles';

interface Props {
  width: number;
}

interface ThemeOption {
  name: ThemeName;
  labelKey: string;
  swatch: readonly [string, string];
}

const SYSTEM_SWATCH: readonly [string, string] = [
  palettes['light'].previewSwatch[0],
  palettes['dark'].previewSwatch[0],
];

const THEME_OPTIONS: ThemeOption[] = [
  { name: 'system',            labelKey: 'settings.themeSystem',            swatch: SYSTEM_SWATCH },
  { name: 'light',             labelKey: 'settings.themeLight',             swatch: palettes['light'].previewSwatch },
  { name: 'dark',              labelKey: 'settings.themeDark',              swatch: palettes['dark'].previewSwatch },
  { name: 'midnightPurple',   labelKey: 'settings.themeMidnightPurple',   swatch: palettes['midnightPurple'].previewSwatch },
  { name: 'monokai',          labelKey: 'settings.themeMonokai',          swatch: palettes['monokai'].previewSwatch },
  { name: 'tomorrowNightBlue',labelKey: 'settings.themeTomorrowNightBlue',swatch: palettes['tomorrowNightBlue'].previewSwatch },
  { name: 'sierraSunset',     labelKey: 'settings.themeSierraSunset',     swatch: palettes['sierraSunset'].previewSwatch },
  { name: 'kimbieDark',       labelKey: 'settings.themeKimbieDark',       swatch: palettes['kimbieDark'].previewSwatch },
];

const SWATCH_SIZE = 24;

function ThemeSwatch({ colors }: { colors: readonly [string, string] }) {
  return (
    <View style={swatchStyles.circle}>
      <View style={[swatchStyles.half, { backgroundColor: colors[0] }]} />
      <View style={[swatchStyles.half, { backgroundColor: colors[1] }]} />
    </View>
  );
}

const swatchStyles = StyleSheet.create({
  circle: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128,128,128,0.3)',
  },
  half: {
    flex: 1,
    height: '100%',
  },
});

export const ThemePickerPage: React.FC<Props> = ({ width }) => {
  const { theme, themeName, setTheme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <PageContainer width={width} scrollable>
      <SafeText style={styles.pageTitle}>{t('onboarding.theme.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.theme.subtitle')}</SafeText>

      <View style={pickerStyles.list}>
        {THEME_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.name}
            style={[
              pickerStyles.row,
              { borderColor: theme.colors.border.faint, backgroundColor: theme.colors.overlay.ghost },
              themeName === option.name && {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.iconTint.primary,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => setTheme(option.name)}
          >
            <ThemeSwatch colors={option.swatch} />
            <SafeText style={[pickerStyles.label, { color: theme.colors.text.primary }]}>
              {t(option.labelKey)}
            </SafeText>
            {themeName === option.name && (
              <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </PageContainer>
  );
};

const pickerStyles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
