import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityRing } from '../../../../components/common/ActivityRing';
import { theme } from '../../../../theme';

interface CompactRingsBarProps {
  strain: { value: number | null; goal: number };
  recovery: { value: number | null; goal: number };
  sleep: { value: number | null; goal: number };
  onStrainPress?: () => void;
  onRecoveryPress?: () => void;
  onSleepPress?: () => void;
}

export const CompactRingsBar: React.FC<CompactRingsBarProps> = ({
  strain,
  recovery,
  sleep,
  onStrainPress,
  onRecoveryPress,
  onSleepPress,
}) => {
  return (
    <View style={styles.bar}>
      <ActivityRing
        value={strain.value}
        goal={strain.goal}
        size={36}
        strokeWidth={4}
        color={theme.colors.strain}
        label="Strain"
        compact
        onPress={onStrainPress}
      />
      <ActivityRing
        value={recovery.value}
        goal={recovery.goal}
        size={36}
        strokeWidth={4}
        color={theme.colors.recovery}
        label="Recovery"
        compact
        onPress={onRecoveryPress}
      />
      <ActivityRing
        value={sleep.value}
        goal={sleep.goal}
        size={36}
        strokeWidth={4}
        color={theme.colors.sleep}
        label="Sleep"
        compact
        onPress={onSleepPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.overlay.light,
  },
});
