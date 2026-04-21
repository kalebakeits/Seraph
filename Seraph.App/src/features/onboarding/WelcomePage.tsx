import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { PageContainer } from './PageContainer';
import { buildStyles } from './OnboardingStyles';

interface Props {
  width: number;
}

const logoWhite = require('../../../assets/logo-white.png') as number;
const logoBlack = require('../../../assets/logo-black.png') as number;

export const WelcomePage: React.FC<Props> = ({ width }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const logo = theme.colors.logoVariant === 'light' ? logoWhite : logoBlack;

  return (
    <PageContainer width={width}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeIconRow}>
          <Image source={logo} style={styles.welcomeLogo} resizeMode="contain" />
        </View>
        <SafeText style={styles.welcomeTitle}>{t('onboarding.welcome.title')}</SafeText>
        <SafeText style={styles.welcomeBody}>{t('onboarding.welcome.body')}</SafeText>
      </View>
    </PageContainer>
  );
};
