import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme, type Theme } from '../../theme';
import { useSystemNotificationContent } from './useSystemNotificationContent';

type Props = NativeStackScreenProps<HomeStackParamList, 'SystemNotificationDetail'>;

export function SystemNotificationDetailScreen({ route }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const { contentId, title } = route.params;
  const { content, loading } = useSystemNotificationContent(contentId, i18n.language);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {loading && <ActivityIndicator color={theme.colors.primary} style={styles.spinner} />}
      {!loading && content && <Text style={styles.body}>{content.body}</Text>}
      {!loading && !content && (
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
    spinner: {
      marginTop: theme.spacing.xl,
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
