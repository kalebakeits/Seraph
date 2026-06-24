import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme, type ThemeName } from '../../../theme';
import { palettes } from '../../../theme/palettes';

interface Props {
  onSelect?: () => void;
}

interface ThemeOption {
  name: ThemeName;
  labelKey: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { name: 'system', labelKey: 'settings.themeSystem' },
  { name: 'light', labelKey: 'settings.themeLight' },
  { name: 'dark', labelKey: 'settings.themeDark' },
  { name: 'midnightPurple', labelKey: 'settings.themeMidnightPurple' },
  { name: 'monokai', labelKey: 'settings.themeMonokai' },
  { name: 'tomorrowNightBlue', labelKey: 'settings.themeTomorrowNightBlue' },
  { name: 'sierraSunset', labelKey: 'settings.themeSierraSunset' },
  { name: 'kimbieDark', labelKey: 'settings.themeKimbieDark' },
];

const SYSTEM_SWATCH: readonly [string, string] = [
  palettes.light.previewSwatch[0],
  palettes.dark.previewSwatch[0],
];
const SWATCH_SIZE = 24;

function swatchForTheme(name: ThemeName): readonly [string, string] {
  if (name === 'system') return SYSTEM_SWATCH;
  return palettes[name].previewSwatch;
}

function ThemeSwatch({ colors }: { colors: readonly [string, string] }) {
  return (
    <View style={swatchStyles.circle}>
      <View style={[swatchStyles.half, { backgroundColor: colors[0] }]} />
      <View style={[swatchStyles.half, { backgroundColor: colors[1] }]} />
    </View>
  );
}

export const ThemeOptionsList: React.FC<Props> = ({ onSelect }) => {
  const { theme, themeName, setTheme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.list}>
      {THEME_OPTIONS.map(option => {
        const selected = themeName === option.name;
        return (
          <TouchableOpacity
            key={option.name}
            style={[styles.row, selected && styles.rowActive]}
            activeOpacity={0.7}
            onPress={() => {
              setTheme(option.name);
              onSelect?.();
            }}
          >
            <ThemeSwatch colors={swatchForTheme(option.name)} />
            <SafeText style={styles.label}>{t(option.labelKey)}</SafeText>
            {selected && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

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

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      gap: theme.spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.faint,
      backgroundColor: theme.colors.overlay.ghost,
    },
    rowActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.iconTint.primary,
    },
    label: {
      flex: 1,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text.primary,
    },
  });
}
