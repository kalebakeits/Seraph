import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme, type ThemeName } from '../../../theme';
import { palettes } from '../../../theme/palettes';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface ThemeOption {
  name: ThemeName;
  labelKey: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { name: 'system',           labelKey: 'settings.themeSystem' },
  { name: 'dark',             labelKey: 'settings.themeDark' },
  { name: 'light',            labelKey: 'settings.themeLight' },
  { name: 'midnightPurple',   labelKey: 'settings.themeMidnightPurple' },
  { name: 'monokai',          labelKey: 'settings.themeMonokai' },
  { name: 'tomorrowNightBlue',labelKey: 'settings.themeTomorrowNightBlue' },
  { name: 'sierraSunset',     labelKey: 'settings.themeSierraSunset' },
  { name: 'kimbieDark',       labelKey: 'settings.themeKimbieDark' },
];

// 'system' has no palette entry — use a fixed half-and-half swatch.
const SYSTEM_SWATCH: readonly [string, string] = ['#f5f5f7', '#111113'];

function swatchForTheme(name: ThemeName): readonly [string, string] {
  if (name === 'system') return SYSTEM_SWATCH;
  return palettes[name].previewSwatch;
}

const SWATCH_SIZE = 28;

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

export const ThemePicker: React.FC<Props> = ({ visible, onClose }) => {
  const { theme, themeName, setTheme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <SafeText style={styles.title}>{t('settings.theme')}</SafeText>
          {THEME_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.name}
              style={styles.option}
              activeOpacity={0.7}
              onPress={() => {
                setTheme(option.name);
                onClose();
              }}
            >
              <View style={styles.optionLeft}>
                <ThemeSwatch colors={swatchForTheme(option.name)} />
                <SafeText style={styles.optionLabel}>{t(option.labelKey)}</SafeText>
              </View>
              {themeName === option.name && (
                <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: theme.colors.scrim.dark,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.surface.sheet,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: theme.spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border.faint,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    optionLabel: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text.primary,
    },
  });
}
