import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from './SafeText';
import { useTheme, type Theme } from '../../theme';

interface Props {
  translationKey: string;
}

export const HelperText: React.FC<Props> = ({ translationKey }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  return <SafeText style={styles.text}>{t(translationKey)}</SafeText>;
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    text: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      lineHeight: 18,
    },
  });
}
