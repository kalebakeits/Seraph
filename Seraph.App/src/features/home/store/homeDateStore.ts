import { create } from 'zustand';
import { todayISO } from '../../../utils/dateUtils';

interface HomeDateState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const useHomeDateStore = create<HomeDateState>(set => ({
  selectedDate: todayISO(),
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },
}));
