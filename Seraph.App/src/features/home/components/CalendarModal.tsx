import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTheme, type Theme } from '../../../theme';

interface Props {
  visible: boolean;
  selectedDate: string;
  maxDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

export const CalendarModal: React.FC<Props> = ({
  visible,
  selectedDate,
  maxDate,
  onSelect,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => buildStyles(theme), [theme]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            /* absorb tap to prevent closing */
          }}
        >
          <Calendar
            current={selectedDate}
            maxDate={maxDate}
            onDayPress={(day: { dateString: string }) => {
              onSelect(day.dateString);
            }}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: theme.colors.primary },
            }}
            theme={{
              backgroundColor: theme.colors.background,
              calendarBackground: theme.colors.background,
              textSectionTitleColor: theme.colors.text.muted,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.text.primary,
              todayTextColor: theme.colors.sleep,
              dayTextColor: theme.colors.text.primary,
              textDisabledColor: theme.colors.text.muted,
              arrowColor: theme.colors.text.primary,
              monthTextColor: theme.colors.text.primary,
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

function buildStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.scrim.dark,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
  });
}
