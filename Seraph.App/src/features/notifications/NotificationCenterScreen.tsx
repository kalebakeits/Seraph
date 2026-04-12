import React, { useEffect, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationsRepository } from '../../services/database/drizzle';
import type { Notification } from '../../services/database/drizzle';
import { navigationRef } from '../../navigation/navigationRef';
import { theme } from '../../theme';
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
  const icon = iconForNotification(item.type, parsePayload(item.payload ?? null).sport);
  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        onPress(item);
      }}
    >
      <View style={styles.rowContent}>
        <View style={styles.iconWrap}>
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
          contentId: payload.content_id,
          title: typeLabel,
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
            heroTitle = typeLabel;
            detail =
              item.type === 'update_available' && payload.version
                ? t('notifications.updateBody', { version: payload.version })
                : (payload.message ?? '');
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingTop: 80, paddingBottom: theme.tabStyles.content.paddingBottom },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.sizes.md,
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm + 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    marginTop: 2,
  },
  eventLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
});
