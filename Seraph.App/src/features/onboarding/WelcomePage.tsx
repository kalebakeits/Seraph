import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import { PageContainer } from './PageContainer';
import { styles } from './OnboardingStyles';

interface Props {
  width: number;
}

export const WelcomePage: React.FC<Props> = ({ width }) => {
  const { t } = useTranslation();

  return (
    <PageContainer width={width}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeIconRow}>
          <Ionicons name="watch-outline" size={64} color={theme.colors.primary} />
        </View>
        <SafeText style={styles.welcomeTitle}>{t('onboarding.welcome.title')}</SafeText>
        <SafeText style={styles.welcomeBody}>{t('onboarding.welcome.body')}</SafeText>
      </View>
    </PageContainer>
  );
};
