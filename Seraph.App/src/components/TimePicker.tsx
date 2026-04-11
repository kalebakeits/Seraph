import React from 'react';
import DatePicker from 'react-native-date-picker';

interface TimePickerProps {
  time: Date;
  onTimeChange: (date: Date) => void;
  open: boolean;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

/**
 * Wrapper around react-native-date-picker for time selection
 * Makes it easy to swap out the underlying picker library
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  time,
  onTimeChange: _onTimeChange,
  open,
  onCancel,
  onConfirm,
}) => {
  return (
    <DatePicker
      modal
      mode="time"
      date={time}
      open={open}
      onConfirm={date => {
        onConfirm(date);
      }}
      onCancel={onCancel}
    />
  );
};
