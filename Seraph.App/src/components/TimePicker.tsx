import React from 'react';
import DatePicker from 'react-native-date-picker';

interface TimePickerProps {
  time: Date;
  onTimeChange: (date: Date) => void;
  open: boolean;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
  /**
   * Picker mode:
   * - "time": Shows only time picker (for alarms, wake-up times, etc.)
   * - "datetime": Shows date and time picker (for manual logging, editing past events)
   * Defaults to "time" for alarm-like uses
   */
  mode?: 'time' | 'datetime';
}

/**
 * Wrapper around react-native-date-picker for time or date-time selection
 * Makes it easy to swap out the underlying picker library
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  time,
  onTimeChange: _onTimeChange,
  open,
  onCancel,
  onConfirm,
  mode = 'time',
}) => {
  return (
    <DatePicker
      modal
      mode={mode}
      date={time}
      open={open}
      onConfirm={date => {
        onConfirm(date);
      }}
      onCancel={onCancel}
    />
  );
};
