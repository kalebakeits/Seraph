import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeText } from '../../../components/common/SafeText';
import { theme } from '../../../theme';

interface StepperHabitInputProps {
  value: number | null;
  step: number;
  onChange: (value: number | null) => void;
}

export const StepperHabitInput: React.FC<StepperHabitInputProps> = ({ value, step, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const displayed = value ?? 0;

  const increment = () => {
    onChange(value === null ? 0 : displayed + step);
  };

  const decrement = () => {
    if (value === null) return;
    const next = displayed - step;
    onChange(next < 0 ? null : next);
  };

  const commitInput = () => {
    setEditing(false);
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    } else {
      onChange(null);
    }
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.valueBtn}
        activeOpacity={0.7}
        onPress={() => {
          setInputText(value !== null ? String(displayed) : '');
          setEditing(true);
        }}
      >
        {editing ? (
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            keyboardType="numeric"
            autoFocus
            onBlur={commitInput}
            onSubmitEditing={commitInput}
            selectTextOnFocus
          />
        ) : (
          <SafeText style={[styles.value, value === null && styles.valueMuted]}>
            {value !== null ? String(displayed) : '—'}
          </SafeText>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={decrement} activeOpacity={0.7}>
        <Ionicons
          name="remove-circle-outline"
          size={26}
          color={value !== null ? theme.colors.text.primary : theme.colors.text.muted}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={increment} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={26} color={theme.colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 2,
  },
  valueBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  valueMuted: {
    color: theme.colors.text.muted,
    fontWeight: theme.typography.weights.regular,
  },
  input: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    width: 48,
    textAlign: 'center',
    padding: 0,
  },
});
