import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../../components/common/SafeText';
import { sectionStyles } from '../../../theme/shared/SectionStyles';
import { theme } from '../../../theme';

export interface NotificationPreferences {
  globalEnabled: boolean;
  deviceLowBattery: boolean;
  deviceAlarmNotSet: boolean;
  activitySleep: boolean;
  activityWorkout: boolean;
}

interface Props {
  preferences: NotificationPreferences;
  onChange: (prefs: NotificationPreferences) => void;
}

const SUB_ROW_HEIGHT = 48;

interface ExpandableSectionProps {
  expanded: boolean;
  count: number;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ expanded, count, children }) => {
  const heightAnim = useRef(new Animated.Value(expanded ? count * SUB_ROW_HEIGHT : 0)).current;
  const opacityAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: expanded ? count * SUB_ROW_HEIGHT : 0,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: expanded ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [expanded, count, heightAnim, opacityAnim]);

  return (
    <Animated.View style={{ height: heightAnim, opacity: opacityAnim, overflow: 'hidden' }}>
      {children}
    </Animated.View>
  );
};

export const NotificationsSection: React.FC<Props> = ({ preferences, onChange }) => {
  const { t } = useTranslation();
  const [expandedDevice, setExpandedDevice] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(false);

  const chevronDeviceAnim = useRef(new Animated.Value(0)).current;
  const chevronActivityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chevronDeviceAnim, {
      toValue: expandedDevice ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [expandedDevice, chevronDeviceAnim]);

  useEffect(() => {
    Animated.timing(chevronActivityAnim, {
      toValue: expandedActivity ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [expandedActivity, chevronActivityAnim]);

  const deviceChevronRotation = chevronDeviceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const activityChevronRotation = chevronActivityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <>
      <SafeText style={[sectionStyles.sectionTitle, styles.sectionGap]}>
        {t('settings.notifications')}
      </SafeText>
      <View style={sectionStyles.container}>
        {/* Global toggle */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <SafeText style={styles.rowLabel}>{t('settings.notificationsGlobalToggle')}</SafeText>
            <SafeText style={styles.rowDesc}>
              {t('settings.notificationsGlobalToggleDesc')}
            </SafeText>
          </View>
          <Switch
            value={preferences.globalEnabled}
            onValueChange={() => {
              onChange({ ...preferences, globalEnabled: !preferences.globalEnabled });
            }}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
            thumbColor="#ffffff"
            ios_backgroundColor="rgba(255,255,255,0.1)"
          />
        </View>

        <View style={styles.divider} />

        {/* Device notifications */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            setExpandedDevice(v => !v);
          }}
          activeOpacity={0.7}
          disabled={!preferences.globalEnabled}
        >
          <SafeText style={[styles.rowLabel, !preferences.globalEnabled && styles.dimmed]}>
            {t('settings.notificationsDeviceTitle')}
          </SafeText>
          <Animated.View
            style={{
              transform: [{ rotate: deviceChevronRotation }],
              opacity: preferences.globalEnabled ? 1 : 0.4,
            }}
          >
            <Ionicons name="chevron-down" size={16} color={theme.colors.text.muted} />
          </Animated.View>
        </TouchableOpacity>

        <ExpandableSection expanded={expandedDevice && preferences.globalEnabled} count={2}>
          <View style={styles.subRow}>
            <SafeText style={styles.subRowLabel}>
              {t('settings.notificationsDeviceLowBattery')}
            </SafeText>
            <Switch
              value={preferences.deviceLowBattery}
              onValueChange={() => {
                onChange({ ...preferences, deviceLowBattery: !preferences.deviceLowBattery });
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
              thumbColor="#ffffff"
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
          <View style={styles.subRow}>
            <SafeText style={styles.subRowLabel}>
              {t('settings.notificationsDeviceAlarmNotSet')}
            </SafeText>
            <Switch
              value={preferences.deviceAlarmNotSet}
              onValueChange={() => {
                onChange({ ...preferences, deviceAlarmNotSet: !preferences.deviceAlarmNotSet });
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
              thumbColor="#ffffff"
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
        </ExpandableSection>

        <View style={styles.divider} />

        {/* Activity detection */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            setExpandedActivity(v => !v);
          }}
          activeOpacity={0.7}
          disabled={!preferences.globalEnabled}
        >
          <SafeText style={[styles.rowLabel, !preferences.globalEnabled && styles.dimmed]}>
            {t('settings.notificationsActivityTitle')}
          </SafeText>
          <Animated.View
            style={{
              transform: [{ rotate: activityChevronRotation }],
              opacity: preferences.globalEnabled ? 1 : 0.4,
            }}
          >
            <Ionicons name="chevron-down" size={16} color={theme.colors.text.muted} />
          </Animated.View>
        </TouchableOpacity>

        <ExpandableSection expanded={expandedActivity && preferences.globalEnabled} count={2}>
          <View style={styles.subRow}>
            <SafeText style={styles.subRowLabel}>
              {t('settings.notificationsActivitySleep')}
            </SafeText>
            <Switch
              value={preferences.activitySleep}
              onValueChange={() => {
                onChange({ ...preferences, activitySleep: !preferences.activitySleep });
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
              thumbColor="#ffffff"
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
          <View style={styles.subRow}>
            <SafeText style={styles.subRowLabel}>
              {t('settings.notificationsActivityWorkout')}
            </SafeText>
            <Switch
              value={preferences.activityWorkout}
              onValueChange={() => {
                onChange({ ...preferences, activityWorkout: !preferences.activityWorkout });
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
              thumbColor="#ffffff"
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
        </ExpandableSection>
      </View>

      <SafeText style={styles.note}>{t('settings.notificationsNote')}</SafeText>
    </>
  );
};

const styles = StyleSheet.create({
  sectionGap: {
    marginTop: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm + 2,
    minHeight: 44,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
    marginRight: theme.spacing.md,
  },
  rowLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  rowDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    lineHeight: 18,
  },
  dimmed: {
    color: theme.colors.text.muted,
    opacity: 0.5,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: SUB_ROW_HEIGHT,
    paddingLeft: theme.spacing.lg,
  },
  subRowLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  note: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    lineHeight: 18,
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
  },
});
