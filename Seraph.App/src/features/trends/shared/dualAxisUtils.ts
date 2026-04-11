import type { DualAxisPoint } from '../../../components/common/SkiaDualAxisChart';

export const DUAL_AXIS_DAYS = 6; // 7 days inclusive

export interface DualAxisData {
  left: DualAxisPoint[];
  right: DualAxisPoint[];
}
