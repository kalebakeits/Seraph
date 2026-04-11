import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GradientBackground } from '../../components/common/GradientBackground';
import { ScreenLayout } from '../../components/common/ScreenLayout';
import { theme } from '../../theme';
import { appParametersRepository } from '../../services/database/drizzle';
import { GranularityPicker } from './components/GranularityPicker';
import { StorageEstimateCard } from './components/StorageEstimateCard';
import { GRANULARITY_OPTIONS, type GranularitySeconds } from './utils/storageUtils';

export const DataStorageScreen: React.FC = () => {
  const [granularity, setGranularity] = useState<GranularitySeconds>(1);

  useEffect(() => {
    void (async () => {
      const saved = await appParametersRepository.getNumeric('r24_granularity_seconds');
      if (saved !== null && GRANULARITY_OPTIONS.includes(saved as GranularitySeconds)) {
        setGranularity(saved as GranularitySeconds);
      }
    })();
  }, []);

  const handleChange = (value: GranularitySeconds) => {
    setGranularity(value);
    void appParametersRepository.set('r24_granularity_seconds', value);
  };

  return (
    <GradientBackground>
      <ScreenLayout contentContainerStyle={styles.content}>
        <GranularityPicker value={granularity} onChange={handleChange} />
        <StorageEstimateCard granularity={granularity} />
      </ScreenLayout>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
});
