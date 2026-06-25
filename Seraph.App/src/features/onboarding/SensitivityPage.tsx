import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { ActivityDetectionSection } from '../settings/sections/ActivityDetectionSection';
import type { SensitivityPreset } from '../settings/SettingsTypes';
import { PageContainer } from './PageContainer';
import { buildStyles } from './OnboardingStyles';

interface Props {
  width: number;
  sensitivity: SensitivityPreset;
  setSensitivity: (v: SensitivityPreset) => void;
}

export const SensitivityPage: React.FC<Props> = ({ width, sensitivity, setSensitivity }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <PageContainer width={width}>
      <SafeText style={styles.pageTitle}>{t('onboarding.sensitivity.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.sensitivity.subtitle')}</SafeText>

      <ActivityDetectionSection selected={sensitivity} onSelect={setSensitivity} />

      <SafeText style={styles.sensitivityHint}>{t('onboarding.sensitivity.hint')}</SafeText>
    </PageContainer>
  );
};
