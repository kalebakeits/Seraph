import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { GradientBackground } from '../../components/common/GradientBackground';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { SafeText } from '../../components/common/SafeText';
import { useTheme, type Theme } from '../../theme';
import type { SettingsStackParamList } from '../../navigation/SettingsStackNavigator';
import { ThemePicker } from './components/ThemePicker';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

interface SettingsRowProps {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  last?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, iconName, onPress, last }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.rowIcon}>
          <Ionicons name={iconName} size={20} color={theme.colors.text.secondary} />
        </View>
        <SafeText style={styles.rowLabel}>{label}</SafeText>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
      </TouchableOpacity>
      {!last && <View style={styles.divider} />}
    </>
  );
};

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  return (
    <GradientBackground>
      <ScreenLayout contentContainerStyle={styles.content}>
        <View style={styles.group}>
          <SettingsRow
            label={t('settings.appearance')}
            iconName="color-palette-outline"
            onPress={() => {
              setThemePickerOpen(true);
            }}
          />
          <SettingsRow
            label={t('settings.profile')}
            iconName="person-outline"
            onPress={() => {
              navigation.navigate('Profile');
            }}
          />
          <SettingsRow
            label={t('settings.preferencesMenu')}
            iconName="options-outline"
            onPress={() => {
              navigation.navigate('Preferences');
            }}
          />
          <SettingsRow
            label={t('settings.dataAndStorage')}
            iconName="server-outline"
            onPress={() => {
              navigation.navigate('DataStorage');
            }}
          />
          <SettingsRow
            label={t('settings.about')}
            iconName="information-circle-outline"
            onPress={() => {
              navigation.navigate('About');
            }}
            last
          />
        </View>
      </ScreenLayout>
      <ThemePicker
        visible={themePickerOpen}
        onClose={() => {
          setThemePickerOpen(false);
        }}
      />
    </GradientBackground>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.lg,
    },
    group: {
      backgroundColor: theme.colors.surface.card,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.sm,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 56,
      gap: theme.spacing.md,
    },
    rowIcon: {
      width: theme.layout.iconSize.md,
      height: theme.layout.iconSize.md,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.overlay.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      flex: 1,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border.faint,
      marginLeft: 52 + theme.spacing.md,
    },
  });
}
