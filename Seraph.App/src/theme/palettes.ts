// Palette registry. Add new themes here — one file per palette in ./palettes/.
import { midnightPurple } from './palettes/midnightPurple';
import { dark } from './palettes/dark';
import { light } from './palettes/light';
import { monokai } from './palettes/monokai';
import { tomorrowNightBlue } from './palettes/tomorrowNightBlue';
import { sierraSunset } from './palettes/sierraSunset';
import { kimbieDark } from './palettes/kimbieDark';
import type { ColorPalette } from './ColorPalette';

export type { ColorPalette } from './ColorPalette';
export { midnightPurple } from './palettes/midnightPurple';
export { dark } from './palettes/dark';
export { light } from './palettes/light';
export { monokai } from './palettes/monokai';
export { tomorrowNightBlue } from './palettes/tomorrowNightBlue';
export { sierraSunset } from './palettes/sierraSunset';
export { kimbieDark } from './palettes/kimbieDark';

export type ThemeName =
  | 'midnightPurple'
  | 'dark'
  | 'light'
  | 'monokai'
  | 'tomorrowNightBlue'
  | 'sierraSunset'
  | 'kimbieDark'
  | 'system';

// 'system' is resolved at runtime in ThemeContext — not a palette itself.
export const palettes: Record<Exclude<ThemeName, 'system'>, ColorPalette> = {
  midnightPurple,
  dark,
  light,
  monokai,
  tomorrowNightBlue,
  sierraSunset,
  kimbieDark,
};
