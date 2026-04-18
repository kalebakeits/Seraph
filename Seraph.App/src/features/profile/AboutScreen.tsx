import React, { useRef, useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../components/common/GradientBackground';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { SafeText } from '../../components/common/SafeText';
import { BugReportSheet } from './components/BugReportSheet';
import { useTheme, type Theme } from '../../theme';
import { buildSectionStyles } from '../../theme/shared/SectionStyles';
import type { SettingsStackParamList } from '../../navigation/SettingsStackNavigator';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

const DEBUG_TAP_COUNT = 7;

export const AboutScreen: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const sectionStyles = useMemo(() => buildSectionStyles(theme), [theme]);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bugReportVisible, setBugReportVisible] = useState(false);

  const fullVersion = Constants.expoConfig?.version ?? '0.0.0';
  const dashIndex = fullVersion.indexOf('-');
  const appVersion = dashIndex === -1 ? fullVersion : fullVersion.slice(0, dashIndex);
  const buildSuffix = dashIndex === -1 ? null : fullVersion.slice(dashIndex + 1);

  const handleVersionPress = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= DEBUG_TAP_COUNT) {
      tapCount.current = 0;
      navigation.navigate('DebugMenu');
    } else {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 1500);
    }
  };

  return (
    <GradientBackground>
      <ScreenLayout contentContainerStyle={styles.content}>
        <SafeText style={sectionStyles.sectionTitle}>{t('settings.appInfo')}</SafeText>
        <View style={sectionStyles.container}>
          <TouchableOpacity style={styles.row} onPress={handleVersionPress} activeOpacity={0.7}>
            <SafeText style={styles.rowLabel}>{t('settings.version')}</SafeText>
            <SafeText style={styles.rowValue}>{appVersion}</SafeText>
          </TouchableOpacity>
          {buildSuffix !== null && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <SafeText style={styles.rowLabel}>{t('settings.build')}</SafeText>
                <SafeText style={styles.rowValue}>{buildSuffix}</SafeText>
              </View>
            </>
          )}
        </View>
        <SafeText style={sectionStyles.sectionTitle}>{t('settings.support')}</SafeText>
        <View style={sectionStyles.container}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => {
              setBugReportVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowIcon}>
              <Ionicons name="bug-outline" size={20} color={theme.colors.text.secondary} />
            </View>
            <SafeText style={styles.actionLabel}>{t('settings.reportBug')}</SafeText>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>
      </ScreenLayout>
      <BugReportSheet
        visible={bugReportVisible}
        onClose={() => {
          setBugReportVisible(false);
        }}
      />
    </GradientBackground>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.xs,
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
    },
    rowValue: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.primary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.overlay.faint,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
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
    actionLabel: {
      flex: 1,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.primary,
    },
  });
}
