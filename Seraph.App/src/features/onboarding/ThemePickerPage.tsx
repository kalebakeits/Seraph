import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { ThemeOptionsList } from '../profile/components/ThemeOptionsList';
import { PageContainer } from './PageContainer';
import { buildStyles } from './OnboardingStyles';

interface Props {
  width: number;
}

export const ThemePickerPage: React.FC<Props> = ({ width }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <PageContainer width={width} scrollable>
      <SafeText style={styles.pageTitle}>{t('onboarding.theme.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.theme.subtitle')}</SafeText>

      <ThemeOptionsList />
    </PageContainer>
  );
};
