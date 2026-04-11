import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { theme } from '../../theme';
import { PageContainer } from './PageContainer';
import { styles } from './OnboardingStyles';
import { SENSITIVITY_PRESETS, type SensitivityPreset } from './OnboardingTypes';

interface Props {
  width: number;
  sensitivity: SensitivityPreset;
  setSensitivity: (v: SensitivityPreset) => void;
}

export const SensitivityPage: React.FC<Props> = ({ width, sensitivity, setSensitivity }) => {
  const { t } = useTranslation();

  return (
    <PageContainer width={width}>
      <SafeText style={styles.pageTitle}>{t('onboarding.sensitivity.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.sensitivity.subtitle')}</SafeText>

      <View style={styles.sensitivityList}>
        {SENSITIVITY_PRESETS.map(preset => {
          const active = sensitivity === preset.key;
          return (
            <TouchableOpacity
              key={preset.key}
              style={[styles.sensitivityRow, active && styles.sensitivityRowActive]}
              onPress={() => {
                setSensitivity(preset.key);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.sensitivityLeft}>
                <SafeText
                  style={[styles.sensitivityLabel, active && { color: theme.colors.strain }]}
                >
                  {t(`onboarding.sensitivity.${preset.key}`)}
                </SafeText>
                <SafeText style={styles.sensitivityDesc}>
                  {t(`onboarding.sensitivity.${preset.key}Desc`)}
                </SafeText>
              </View>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.colors.strain}
                style={{ marginLeft: 8, opacity: active ? 1 : 0 }}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <SafeText style={styles.sensitivityHint}>{t('onboarding.sensitivity.hint')}</SafeText>
    </PageContainer>
  );
};
