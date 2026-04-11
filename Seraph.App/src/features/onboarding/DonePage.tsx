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

export const DonePage: React.FC<Props> = ({ width }) => {
  const { t } = useTranslation();
  return (
    <PageContainer width={width}>
      <View style={styles.doneContent}>
        <View style={styles.doneIconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={theme.colors.recovery} />
        </View>
        <SafeText style={styles.doneTitle}>{t('onboarding.done.title')}</SafeText>
        <SafeText style={styles.doneBody}>{t('onboarding.done.body')}</SafeText>
        <SafeText style={styles.doneTip}>{t('onboarding.done.tip')}</SafeText>
      </View>
    </PageContainer>
  );
};
