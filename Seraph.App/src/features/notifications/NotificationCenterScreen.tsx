import React, { useEffect, useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationsRepository } from '../../services/database/drizzle';
import type { Notification } from '../../services/database/drizzle';
import { navigationRef } from '../../navigation/navigationRef';
import { useTheme, type Theme } from '../../theme';
import {
  parsePayload,
  formatNotificationTitle,
  formatNotificationDetail,
  iconForNotification,
  isSystemNotification,
} from './notificationUtils';

function relativeTime(
  createdAt: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const diffMs = Date.now() - createdAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('time.justNow', { defaultValue: 'Just now' });
  if (mins < 60) return t('time.minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('time.daysAgo', { count: days });
  return new Date(createdAt).toLocaleDateString();
}

interface NotificationRowProps {
  item: Notification;
  heroTitle: string;
  detail: string;
  timeAgo: string;
  eventLabel: string;
  onPress: (item: Notification) => void;
}

function NotificationRow({
  item,
  heroTitle,
  detail,
  timeAgo,
  eventLabel,
  onPress,
}: NotificationRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const icon = iconForNotification(item.type, parsePayload(item.payload ?? null).sport, theme);
  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        onPress(item);
      }}
    >
      <View style={styles.rowContent}>
        <View style={[styles.iconWrap, { backgroundColor: icon.tint, borderColor: icon.color }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.textWrap}>
          <View style={styles.topRow}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {heroTitle}
            </Text>
            <View style={styles.metaWrap}>
              {item.read === 0 && <View style={styles.unreadDot} />}
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
          </View>
          {detail ? (
            <Text style={styles.detail} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
          <Text style={styles.eventLabel}>{eventLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function NotificationCenterScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const notifications = useNotifications();

  useEffect(() => {
    void notificationsRepository.markAllRead().then(() => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
  }, [queryClient]);

  const handlePress = useCallback(
    (item: Notification) => {
      if (!navigationRef.isReady()) return;
      if (isSystemNotification(item.type)) {
        const payload = parsePayload(item.payload ?? null);
        const typeLabel = t(`notifications.types.${item.type}`, { defaultValue: item.type });
        navigationRef.navigate('SystemNotificationDetail', {
          title: payload.title ?? typeLabel,
          body: payload.body ?? '',
          type: item.type,
        });
        return;
      }
      if (!item.payload) return;
      const nav = parsePayload(item.payload);
      if (!nav.screen) return;
      if (nav.screen === 'WorkoutDetail' && nav.activityId != null) {
        navigationRef.navigate('WorkoutDetail', { activityId: nav.activityId });
      } else if (nav.screen === 'SleepSessionDetail' && nav.sleepId != null) {
        navigationRef.navigate('SleepSessionDetail', { sleepId: nav.sleepId });
      }
    },
    [t],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => {
          const payload = parsePayload(item.payload);
          const typeLabel = t(`notifications.types.${item.type}`, { defaultValue: item.type });
          const isSystem = isSystemNotification(item.type);
          let heroTitle: string;
          let detail: string;
          if (isSystem) {
            heroTitle = payload.title ?? typeLabel;
            detail =
              item.type === 'update_available' && payload.version
                ? t('notifications.updateBody', { version: payload.version })
                : (payload.body ?? '');
          } else {
            const scoreLabel =
              payload.score != null ? t('notifications.score', { value: payload.score }) : '';
            const avgHrLabel =
              payload.avg_hr != null ? t('notifications.avgHr', { value: payload.avg_hr }) : '';
            heroTitle = formatNotificationTitle(typeLabel);
            detail = formatNotificationDetail(payload, i18n.language, scoreLabel, avgHrLabel);
          }
          return (
            <NotificationRow
              item={item}
              heroTitle={heroTitle}
              detail={detail}
              timeAgo={relativeTime(
                item.created_at,
                t as (key: string, opts?: Record<string, unknown>) => string,
              )}
              eventLabel={isSystem ? '' : typeLabel}
              onPress={handlePress}
            />
          );
        }}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={<Text style={styles.emptyText}>{t('notifications.empty')}</Text>}
      />
    </View>
  );
}

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    listContent: {
      paddingTop: theme.layout.screenPadding,
      paddingBottom: theme.tabStyles.content.paddingBottom,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: theme.layout.screenPadding,
    },
    emptyText: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.sizes.md,
    },
    row: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.overlay.soft,
    },
    rowContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.sm + 4,
    },
    iconWrap: {
      width: theme.layout.iconSize.md,
      height: theme.layout.iconSize.md,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    textWrap: { flex: 1 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroTitle: {
      flex: 1,
      color: theme.colors.text.primary,
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      marginRight: theme.spacing.sm,
    },
    metaWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    timeAgo: {
      color: theme.colors.text.muted,
      fontSize: theme.typography.sizes.xs,
    },
    detail: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.sizes.xs,
      marginTop: theme.spacing.xxs,
    },
    eventLabel: {
      color: theme.colors.text.muted,
      fontSize: theme.typography.sizes.xs,
      marginTop: theme.spacing.xxs,
    },
  });
}
