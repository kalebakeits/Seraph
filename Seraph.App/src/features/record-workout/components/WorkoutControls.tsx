import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';

type RecordingPhase = 'idle' | 'recording' | 'paused';

interface WorkoutControlsProps {
  phase: RecordingPhase;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  phase,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false,
}) => {
  if (phase === 'idle') {
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.iconBtn, styles.primaryBtn]}
          activeOpacity={0.8}
          onPress={onStart}
          disabled={disabled}
        >
          <Ionicons name="play" size={32} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'paused') {
    return (
      <View style={styles.column}>
        <View style={styles.pausedBanner}>
          <SafeText style={styles.pausedText}>PAUSED</SafeText>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.primaryBtn, { flex: 1 }]}
            activeOpacity={0.8}
            onPress={onResume}
            disabled={disabled}
          >
            <Ionicons name="play" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.stopBtn, { flex: 1 }]}
            activeOpacity={0.8}
            onPress={onStop}
            disabled={disabled}
          >
            <Ionicons name="stop" size={28} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // recording
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.iconBtn, styles.secondaryBtn]}
        activeOpacity={0.8}
        onPress={onPause}
        disabled={disabled}
      >
        <Ionicons name="pause" size={32} color={theme.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  iconBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: theme.colors.strain,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.colors.overlay.light,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  stopBtn: {
    borderWidth: 1,
    borderColor: theme.colors.overlay.light,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pausedBanner: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(245,87,108,0.15)',
  },
  pausedText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.strain,
    letterSpacing: 2,
  },
});
