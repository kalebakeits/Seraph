import React from 'react';
import DatePicker from 'react-native-date-picker';
import { dateFromISO, isoFromDate } from '../../../utils/dateUtils';

const DEFAULT_DOB_AGE_YEARS = 30;
const MIN_DOB_AGE_YEARS = 120;

interface Props {
  dob: string;
  open: boolean;
  onConfirm: (iso: string) => void;
  onCancel: () => void;
}

export const DobDatePicker: React.FC<Props> = ({ dob, open, onConfirm, onCancel }) => {
  const today = new Date();
  const defaultDobDate = new Date();
  defaultDobDate.setFullYear(today.getFullYear() - DEFAULT_DOB_AGE_YEARS);
  const minDobDate = new Date();
  minDobDate.setFullYear(today.getFullYear() - MIN_DOB_AGE_YEARS);
  const dobDate = dob ? dateFromISO(dob) : defaultDobDate;

  return (
    <DatePicker
      modal
      mode="date"
      date={dobDate}
      minimumDate={minDobDate}
      maximumDate={today}
      open={open}
      onConfirm={date => {
        onConfirm(isoFromDate(date));
      }}
      onCancel={onCancel}
    />
  );
};
