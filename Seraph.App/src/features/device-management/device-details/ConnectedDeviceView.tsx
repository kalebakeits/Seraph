import React, { useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDeviceStore } from '../store/deviceStore';
import { DeviceInfoCard } from './components/DeviceInfoCard';
import { ActionRow } from './components/ActionRow';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';
import { nativeReboot, nativeEraseAllData } from '../../../services/ble/nativeModule';
import type { HomeStackParamList } from '../../../navigation/HomeStackNavigator';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface ConnectedDeviceViewProps {
  onForget: () => void;
}

export const ConnectedDeviceView: React.FC<ConnectedDeviceViewProps> = ({ onForget }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { battery, charging, onWrist, cachedDevice } = useDeviceStore();
  const queryClient = useQueryClient();

  const deviceName = cachedDevice?.name ?? t('device.unknownDevice');

  const handleReboot = () => {
    Alert.alert(t('device.rebootTitle'), t('device.rebootConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('device.rebootAction'),
        style: 'destructive',
        onPress: () => {
          void nativeReboot().catch();
        },
      },
    ]);
  };

  const handleEraseData = () => {
    Alert.alert(t('device.eraseTitle'), t('device.eraseConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('device.eraseAction'),
        style: 'destructive',
        onPress: () => {
          void nativeEraseAllData().catch();
        },
      },
    ]);
  };

  const handleForget = () => {
    Alert.alert(t('device.forgetTitle'), t('device.forgetConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('device.forgetAction'), style: 'destructive', onPress: onForget },
    ]);
  };

  const onRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['lastTrim'] });
  }, [queryClient]);

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <DeviceInfoCard
        deviceName={deviceName}
        battery={battery}
        charging={charging}
        onWrist={onWrist}
      />

      {(cachedDevice?.firmwareVersion ?? cachedDevice?.hardwareVersion) && (
        <TouchableOpacity
          style={styles.firmwareCard}
          onLongPress={() => {
            navigation.navigate('DebugMenu');
          }}
          activeOpacity={0.7}
          delayLongPress={600}
        >
          <View style={styles.firmwareIconWrap}>
            <Ionicons name="hardware-chip-outline" size={18} color={theme.colors.text.muted} />
          </View>
          <View style={styles.firmwareText}>
            <SafeText style={styles.firmwareLabel}>{t('device.firmware')}</SafeText>
            <SafeText style={styles.firmwareValue}>
              {[cachedDevice.firmwareVersion, cachedDevice.hardwareVersion]
                .filter(Boolean)
                .join(' · ')}
            </SafeText>
          </View>
          <Ionicons name="ellipsis-horizontal" size={14} color={theme.colors.text.muted} />
        </TouchableOpacity>
      )}

      <SafeText style={styles.sectionTitle}>{t('device.actions')}</SafeText>
      <View style={styles.actionCard}>
        <ActionRow
          icon="trash-outline"
          label={t('device.eraseData')}
          sublabel={t('device.eraseDataHint')}
          onPress={handleEraseData}
          destructive
        />
        <View style={styles.divider} />
        <ActionRow
          icon="power-outline"
          label={t('device.reboot')}
          onPress={handleReboot}
          destructive
        />
        <View style={styles.divider} />
        <ActionRow
          icon="unlink-outline"
          label={t('device.forget')}
          onPress={handleForget}
          destructive
        />
      </View>
    </ScrollView>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    scrollContainer: { flex: 1 },
    contentContainer: {
      padding: theme.spacing.md,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.tabStyles.content.paddingBottom,
    },
    firmwareCard: {
      ...theme.cardStyles.default,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    firmwareIconWrap: {
      width: theme.layout.iconSize.sm,
      height: theme.layout.iconSize.sm,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.overlay.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    firmwareText: { flex: 1 },
    firmwareLabel: {
      fontSize: theme.typography.sizes.xs,
      color: theme.colors.text.muted,
      marginBottom: theme.spacing.xxs,
    },
    firmwareValue: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text.secondary,
      fontFamily: 'monospace',
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.xs,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text.muted,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
    },
    actionCard: {
      ...theme.cardStyles.default,
      padding: 0,
      overflow: 'hidden',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.overlay.light,
      marginLeft: 52,
    },
  });
}
