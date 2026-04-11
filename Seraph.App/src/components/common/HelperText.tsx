import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeText } from './SafeText';
import { theme } from '../../theme';

interface Props {
  translationKey: string;
}

export const HelperText: React.FC<Props> = ({ translationKey }) => {
  const { t } = useTranslation();
  return <SafeText style={styles.text}>{t(translationKey)}</SafeText>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    lineHeight: 18,
  },
});
