import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeText } from '../../components/common/SafeText';
import { useTheme } from '../../theme';
import { ScanSection } from '../device-management/components/ScanSection';
import { useDeviceStore } from '../device-management/store/deviceStore';
import { PageContainer } from './PageContainer';
import { buildStyles } from './OnboardingStyles';

interface Props {
  width: number;
  onConnected: () => void;
}

export const ConnectPage: React.FC<Props> = ({ width, onConnected }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  const { t } = useTranslation();
  const { isConnected, isScanning, isConnecting, scannedDevices, scan, connect } = useDeviceStore();

  useEffect(() => {
    if (isConnected) {
      onConnected();
    }
  }, [isConnected, onConnected]);

  return (
    <PageContainer width={width} scrollable>
      <View style={connectStyles.iconRow}>
        <View style={[connectStyles.iconBg, { backgroundColor: theme.colors.bluetooth + '22' }]}>
          <Ionicons name="bluetooth" size={36} color={theme.colors.bluetooth} />
        </View>
      </View>

      <SafeText style={styles.pageTitle}>{t('onboarding.connect.title')}</SafeText>
      <SafeText style={styles.pageSubtitle}>{t('onboarding.connect.subtitle')}</SafeText>

      {isConnecting && (
        <View style={connectStyles.statusRow}>
          <ActivityIndicator size="small" color={theme.colors.bluetooth} />
          <SafeText style={[connectStyles.statusText, { color: theme.colors.text.secondary }]}>
            {t('onboarding.connect.connecting')}
          </SafeText>
        </View>
      )}

      <ScanSection
        scannedDevices={scannedDevices}
        isScanning={isScanning}
        isConnecting={isConnecting}
        onScan={() => void scan()}
        onSelectDevice={d => void connect(d.id, d.name)}
        showTitle={false}
      />

      <SafeText style={[connectStyles.tip, { color: theme.colors.text.muted }]}>
        {t('onboarding.connect.tip')}
      </SafeText>
    </PageContainer>
  );
};

const connectStyles = StyleSheet.create({
  iconRow: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
  },
  tip: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});
