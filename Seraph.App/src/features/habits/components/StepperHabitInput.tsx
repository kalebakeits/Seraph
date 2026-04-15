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
    onChange(displayed + step);
  };

  const decrement = () => {
    const next = displayed - step;
    onChange(next <= 0 ? null : next);
  };

  const commitInput = () => {
    setEditing(false);
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
    } else {
      onChange(null);
    }
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.iconBtn} onPress={decrement} activeOpacity={0.7}>
        <Ionicons
          name="remove-circle-outline"
          size={26}
          color={displayed > 0 ? theme.colors.text.primary : theme.colors.text.muted}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.valueBtn}
        activeOpacity={0.7}
        onPress={() => {
          setInputText(displayed > 0 ? String(displayed) : '');
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
          <SafeText style={[styles.value, displayed === 0 && styles.valueMuted]}>
            {displayed > 0 ? String(displayed) : '—'}
          </SafeText>
        )}
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
    minWidth: 36,
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
    minWidth: 36,
    textAlign: 'center',
    padding: 0,
  },
});
