import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme, type Theme } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'SystemNotificationDetail'>;

export function SystemNotificationDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const { title, body } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {body ? (
        <Text style={styles.body}>{body}</Text>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>{t('notifications.contentUnavailable')}</Text>
          <Text style={styles.placeholderHint}>{t('notifications.contentUnavailableHint')}</Text>
        </View>
      )}
    </View>
  );
}

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    title: {
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      marginBottom: theme.spacing.lg,
    },
    body: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.md,
      lineHeight: 24,
    },
    placeholder: {
      marginTop: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    placeholderTitle: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.md,
      textAlign: 'center',
    },
    placeholderHint: {
      color: theme.colors.text.muted,
      fontSize: theme.typography.sizes.sm,
      textAlign: 'center',
    },
  });
}
