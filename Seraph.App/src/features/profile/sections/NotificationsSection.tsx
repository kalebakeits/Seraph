import React, { useState } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity } from 'react-native';
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

export const NotificationsSection: React.FC<Props> = ({ preferences, onChange }) => {
  const { t } = useTranslation();
  const [expandedDevice, setExpandedDevice] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState(false);

  const toggleGlobal = () => {
    onChange({ ...preferences, globalEnabled: !preferences.globalEnabled });
  };

  const toggleDeviceLowBattery = () => {
    onChange({ ...preferences, deviceLowBattery: !preferences.deviceLowBattery });
  };

  const toggleDeviceAlarmNotSet = () => {
    onChange({ ...preferences, deviceAlarmNotSet: !preferences.deviceAlarmNotSet });
  };

  const toggleActivitySleep = () => {
    onChange({ ...preferences, activitySleep: !preferences.activitySleep });
  };

  const toggleActivityWorkout = () => {
    onChange({ ...preferences, activityWorkout: !preferences.activityWorkout });
  };

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
            <SafeText style={styles.rowDesc}>{t('settings.notificationsGlobalToggleDesc')}</SafeText>
          </View>
          <Switch
            value={preferences.globalEnabled}
            onValueChange={toggleGlobal}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
            thumbColor="#ffffff"
            ios_backgroundColor="rgba(255,255,255,0.1)"
          />
        </View>

        <View style={styles.divider} />

        {/* Device notifications section */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            setExpandedDevice(!expandedDevice);
          }}
          activeOpacity={0.7}
          disabled={!preferences.globalEnabled}
        >
          <SafeText
            style={[
              styles.rowLabel,
              !preferences.globalEnabled && { color: theme.colors.text.muted },
            ]}
          >
            {t('settings.notificationsDeviceTitle')}
          </SafeText>
          <Ionicons
            name={expandedDevice ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={preferences.globalEnabled ? theme.colors.text.muted : theme.colors.text.muted}
            style={{ opacity: preferences.globalEnabled ? 1 : 0.5 }}
          />
        </TouchableOpacity>

        {expandedDevice && preferences.globalEnabled && (
          <>
            <View style={styles.subRow}>
              <SafeText style={styles.subRowLabel}>
                {t('settings.notificationsDeviceLowBattery')}
              </SafeText>
              <Switch
                value={preferences.deviceLowBattery}
                onValueChange={toggleDeviceLowBattery}
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
                onValueChange={toggleDeviceAlarmNotSet}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
                thumbColor="#ffffff"
                ios_backgroundColor="rgba(255,255,255,0.1)"
              />
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* Activity detection section */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            setExpandedActivity(!expandedActivity);
          }}
          activeOpacity={0.7}
          disabled={!preferences.globalEnabled}
        >
          <SafeText
            style={[
              styles.rowLabel,
              !preferences.globalEnabled && { color: theme.colors.text.muted },
            ]}
          >
            {t('settings.notificationsActivityTitle')}
          </SafeText>
          <Ionicons
            name={expandedActivity ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={preferences.globalEnabled ? theme.colors.text.muted : theme.colors.text.muted}
            style={{ opacity: preferences.globalEnabled ? 1 : 0.5 }}
          />
        </TouchableOpacity>

        {expandedActivity && preferences.globalEnabled && (
          <>
            <View style={styles.subRow}>
              <SafeText style={styles.subRowLabel}>
                {t('settings.notificationsActivitySleep')}
              </SafeText>
              <Switch
                value={preferences.activitySleep}
                onValueChange={toggleActivitySleep}
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
                onValueChange={toggleActivityWorkout}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.strain }}
                thumbColor="#ffffff"
                ios_backgroundColor="rgba(255,255,255,0.1)"
              />
            </View>
          </>
        )}
      </View>

      {/* Note at the bottom */}
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
  },
  rowLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  rowDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    lineHeight: 18,
    paddingRight: theme.spacing.sm,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.lg,
    minHeight: 44,
  },
  subRowLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
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
