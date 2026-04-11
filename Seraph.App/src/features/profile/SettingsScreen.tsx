import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { GradientBackground } from '../../components/common/GradientBackground';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import { sectionStyles } from '../../theme/shared/SectionStyles';
import type { SettingsStackParamList } from '../../navigation/SettingsStackNavigator';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

interface SettingsRowProps {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, iconName, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.rowIcon}>
      <Ionicons name={iconName} size={20} color={theme.colors.text.secondary} />
    </View>
    <SafeText style={styles.rowLabel}>{label}</SafeText>
    <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  return (
    <GradientBackground>
      <ScreenLayout contentContainerStyle={styles.content}>
        <SafeText style={sectionStyles.sectionTitle}>{t('settings.title')}</SafeText>
        <View style={sectionStyles.container}>
          <SettingsRow
            label={t('settings.profileAndPreferences')}
            iconName="person-outline"
            onPress={() => {
              navigation.navigate('ProfileSettings');
            }}
          />
          <View style={styles.divider} />
          <SettingsRow
            label={t('settings.dataAndStorage')}
            iconName="server-outline"
            onPress={() => {
              navigation.navigate('DataStorage');
            }}
          />
          <View style={styles.divider} />
          <SettingsRow
            label={t('settings.about')}
            iconName="information-circle-outline"
            onPress={() => {
              navigation.navigate('About');
            }}
          />
        </View>
      </ScreenLayout>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    minHeight: 56,
    gap: theme.spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 52,
  },
});
