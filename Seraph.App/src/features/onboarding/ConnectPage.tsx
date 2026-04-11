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

export const ConnectPage: React.FC<Props> = ({ width }) => {
  const { t } = useTranslation();

  return (
    <PageContainer width={width}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeIconRow}>
          <View style={[styles.tutorialIconBg, { backgroundColor: theme.colors.primary + '22' }]}>
            <Ionicons name="bluetooth-outline" size={36} color={theme.colors.primary} />
          </View>
        </View>
        <SafeText style={styles.welcomeTitle}>{t('onboarding.connect.title')}</SafeText>
        <SafeText style={styles.welcomeBody}>{t('onboarding.connect.body')}</SafeText>
        <SafeText style={styles.doneTip}>{t('onboarding.connect.tip')}</SafeText>
      </View>
    </PageContainer>
  );
};
