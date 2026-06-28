import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { PageContainer } from './PageContainer';
import { buildStyles } from './OnboardingStyles';
import { GranularityPicker } from '../settings/components/GranularityPicker';
import { StorageEstimateCard } from '../settings/components/StorageEstimateCard';
import type { GranularitySeconds } from '../settings/utils/storageUtils';

interface Props {
  width: number;
  granularity: GranularitySeconds;
  setGranularity: (v: GranularitySeconds) => void;
}

export const StoragePage: React.FC<Props> = ({ width, granularity, setGranularity }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <PageContainer width={width}>
      <SafeText style={styles.pageTitle}>{t('onboarding.storage.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.storage.subtitle')}</SafeText>
      <GranularityPicker value={granularity} onChange={setGranularity} />
      <StorageEstimateCard granularity={granularity} />
    </PageContainer>
  );
};
