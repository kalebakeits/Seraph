import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { useTheme, type Theme } from '../../../theme';

type RecordingPhase = 'idle' | 'recording' | 'paused' | 'auto_paused';

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
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  if (phase === 'idle') {
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.iconBtn, styles.primaryBtn]}
          activeOpacity={0.8}
          onPress={onStart}
          disabled={disabled}
        >
          <Ionicons name="play" size={32} color={theme.colors.icon.onLight} />
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'paused' || phase === 'auto_paused') {
    return (
      <View style={styles.column}>
        <View style={styles.pausedBanner}>
          <SafeText style={styles.pausedText}>
            {phase === 'auto_paused' ? 'AUTO-PAUSED' : 'PAUSED'}
          </SafeText>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.iconBtn, styles.primaryBtn, { flex: 1 }]}
            activeOpacity={0.8}
            onPress={onResume}
            disabled={disabled}
          >
            <Ionicons name="play" size={28} color={theme.colors.icon.onLight} />
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

function buildStyles(theme: Theme) {
  return StyleSheet.create({
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
      backgroundColor: theme.colors.overlay.muted,
    },
    stopBtn: {
      borderWidth: 1,
      borderColor: theme.colors.overlay.light,
      backgroundColor: theme.colors.overlay.muted,
    },
    pausedBanner: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.overlay.medium,
    },
    pausedText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.strain,
      letterSpacing: 2,
    },
  });
}
