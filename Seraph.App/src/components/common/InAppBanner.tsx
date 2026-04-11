import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { seraphEmitter, type InAppNotificationEvent } from '../../services/ble/nativeModule';
import { navigationRef } from '../../navigation/navigationRef';
import { theme } from '../../theme';
import {
  parsePayload,
  formatNotificationTitle,
  formatNotificationDetail,
  iconForNotification,
} from '../../features/notifications/notificationUtils';

const SLIDE_DURATION = 250;
const DISMISS_AFTER_MS = 4000;
const DISMISS_THRESHOLD = -30;

export const InAppBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<InAppNotificationEvent | null>(null);
  const queue = useRef<InAppNotificationEvent[]>([]);
  const showing = useRef(false);
  const slideY = useRef(new Animated.Value(-120)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissRef = useRef<() => void>(() => undefined);
  const showRef = useRef<(event: InAppNotificationEvent) => void>(() => undefined);

  dismissRef.current = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(slideY, {
      toValue: -120,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      showing.current = false;
      setCurrent(null);
      const next = queue.current.shift();
      if (next) showRef.current(next);
    });
  };

  showRef.current = (event: InAppNotificationEvent) => {
    showing.current = true;
    setCurrent(event);
    slideY.setValue(-120);
    Animated.timing(slideY, {
      toValue: 0,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
    }).start();
    dismissTimer.current = setTimeout(() => {
      dismissRef.current();
    }, DISMISS_AFTER_MS);
  };

  useEffect(() => {
    const sub = seraphEmitter.addListener(
      'onInAppNotification',
      (event: InAppNotificationEvent) => {
        if (showing.current) {
          queue.current.push(event);
        } else {
          showRef.current(event);
        }
      },
    );
    return () => {
      sub.remove();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -5,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) slideY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < DISMISS_THRESHOLD) {
          dismissRef.current();
        } else {
          Animated.spring(slideY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const handleTap = () => {
    if (current?.payload) {
      const nav = parsePayload(current.payload);
      if (nav.screen && navigationRef.isReady()) {
        if (nav.screen === 'WorkoutDetail' && nav.activityId != null) {
          navigationRef.navigate('WorkoutDetail', { activityId: nav.activityId });
        } else if (nav.screen === 'SleepSessionDetail' && nav.sleepId != null) {
          navigationRef.navigate('SleepSessionDetail', { sleepId: nav.sleepId });
        }
      }
    }
    dismissRef.current();
  };

  if (!current) return null;

  const payload = parsePayload(current.payload);
  const icon = iconForNotification(current.type, payload.sport);
  const typeLabel = t(`notifications.types.${current.type}`, { defaultValue: current.type });
  const sportLabel = payload.sport
    ? t(`sports.${payload.sport}`, { defaultValue: payload.sport })
    : undefined;
  const scoreLabel =
    payload.score != null ? t('notifications.score', { value: payload.score }) : '';
  const avgHrLabel =
    payload.avg_hr != null ? t('notifications.avgHr', { value: payload.avg_hr }) : '';
  const heroTitle = formatNotificationTitle(typeLabel, sportLabel, payload, i18n.language);
  const detail = formatNotificationDetail(payload, i18n.language, scoreLabel, avgHrLabel);

  return (
    <Animated.View
      style={[styles.container, { top: insets.top + 8, transform: [{ translateY: slideY }] }]}
      {...panResponder.panHandlers}
    >
      <Pressable onPress={handleTap} style={styles.inner}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {heroTitle}
          </Text>
          {detail ? (
            <Text style={styles.body} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
    backgroundColor: 'rgba(30, 0, 55, 0.95)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
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
  },
  textWrap: { flex: 1 },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  body: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
});
