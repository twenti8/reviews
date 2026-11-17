import type { CustomThemeColors, PresetThemeId, ThemeConfig, ThemePalette } from '../types/store';
import { getContrastTextColor, isDarkHexColor } from '../utils/storeHelpers';

export const PRESET_THEMES: ThemePalette[] = [
  // 6 Light Pastel Themes
  {
    id: 'pastel-pink',
    name: 'ชมพูพาสเทล',
    mode: 'light',
    bg: '#FDF6F8',
    card: '#FFFFFF',
    cardSubtle: '#FBF0F3',
    border: 'rgba(190, 92, 122, 0.14)',
    text: '#3A232B',
    textMuted: '#7B5864',
    accent: '#D96B91',
    accentSoft: 'rgba(217, 107, 145, 0.14)',
    accentText: '#FFFFFF',
    star: '#E89B3C',
    shadowColor: 'rgba(182, 92, 124, 0.14)',
  },
  {
    id: 'pastel-peach',
    name: 'พีช',
    mode: 'light',
    bg: '#FDF7F2',
    card: '#FFFFFF',
    cardSubtle: '#FBF1E9',
    border: 'rgba(194, 110, 68, 0.14)',
    text: '#3B271C',
    textMuted: '#7E5E4D',
    accent: '#DF7A50',
    accentSoft: 'rgba(223, 122, 80, 0.14)',
    accentText: '#FFFFFF',
    star: '#E59535',
    shadowColor: 'rgba(194, 110, 68, 0.14)',
  },
  {
    id: 'pastel-butter',
    name: 'เนยเหลือง',
    mode: 'light',
    bg: '#FCF9EE',
    card: '#FFFFFF',
    cardSubtle: '#F8F3DF',
    border: 'rgba(164, 130, 44, 0.16)',
    text: '#38301B',
    textMuted: '#736544',
    accent: '#C59326',
    accentSoft: 'rgba(197, 147, 38, 0.15)',
    accentText: '#FFFFFF',
    star: '#D98A1B',
    shadowColor: 'rgba(164, 130, 44, 0.14)',
  },
  {
    id: 'pastel-mint',
    name: 'มินต์',
    mode: 'light',
    bg: '#F2FAF7',
    card: '#FFFFFF',
    cardSubtle: '#E7F5EF',
    border: 'rgba(54, 145, 116, 0.15)',
    text: '#1B372E',
    textMuted: '#4E7568',
    accent: '#329A79',
    accentSoft: 'rgba(50, 154, 121, 0.14)',
    accentText: '#FFFFFF',
    star: '#E0942E',
    shadowColor: 'rgba(50, 154, 121, 0.14)',
  },
  {
    id: 'pastel-sky',
    name: 'ฟ้าใส',
    mode: 'light',
    bg: '#F3F8FD',
    card: '#FFFFFF',
    cardSubtle: '#E9F2FB',
    border: 'rgba(59, 125, 186, 0.15)',
    text: '#1D2F42',
    textMuted: '#536D87',
    accent: '#4287CA',
    accentSoft: 'rgba(66, 135, 202, 0.14)',
    accentText: '#FFFFFF',
    star: '#E59535',
    shadowColor: 'rgba(66, 135, 202, 0.14)',
  },
  {
    id: 'pastel-lavender',
    name: 'ลาเวนเดอร์',
    mode: 'light',
    bg: '#F7F4FC',
    card: '#FFFFFF',
    cardSubtle: '#EFEAF8',
    border: 'rgba(124, 92, 182, 0.15)',
    text: '#2C223D',
    textMuted: '#655680',
    accent: '#825EC7',
    accentSoft: 'rgba(130, 94, 199, 0.14)',
    accentText: '#FFFFFF',
    star: '#E59535',
    shadowColor: 'rgba(130, 94, 199, 0.14)',
  },

  // 6 Luxury Dark Themes
  {
    id: 'dark-pink',
    name: 'ดำชมพู',
    mode: 'dark',
    bg: '#161114',
    card: '#21191E',
    cardSubtle: '#2A2026',
    border: 'rgba(244, 169, 195, 0.16)',
    text: '#F9EEF2',
    textMuted: '#C7AAB5',
    accent: '#E885A8',
    accentSoft: 'rgba(232, 133, 168, 0.18)',
    accentText: '#1F1117',
    star: '#F3B65B',
    shadowColor: 'rgba(0, 0, 0, 0.45)',
  },
  {
    id: 'dark-peach',
    name: 'ดำพีช',
    mode: 'dark',
    bg: '#171210',
    card: '#231B17',
    cardSubtle: '#2D221D',
    border: 'rgba(244, 178, 140, 0.16)',
    text: '#FAF0EA',
    textMuted: '#C9B1A3',
    accent: '#EB936B',
    accentSoft: 'rgba(235, 147, 107, 0.18)',
    accentText: '#22130D',
    star: '#F3B65B',
    shadowColor: 'rgba(0, 0, 0, 0.45)',
  },
  {
    id: 'dark-butter',
    name: 'ดำเนย',
    mode: 'dark',
    bg: '#15130E',
    card: '#201D15',
    cardSubtle: '#2A261B',
    border: 'rgba(236, 206, 128, 0.16)',
    text: '#F8F4E8',
    textMuted: '#C4BBA2',
    accent: '#DFB654',
    accentSoft: 'rgba(223, 182, 84, 0.18)',
    accentText: '#1D180A',
    star: '#F4C152',
    shadowColor: 'rgba(0, 0, 0, 0.45)',
  },
  {
    id: 'dark-mint',
    name: 'ดำมินต์',
    mode: 'dark',
    bg: '#0E1614',
    card: '#16221E',
    cardSubtle: '#1E2D28',
    border: 'rgba(130, 219, 190, 0.16)',
    text: '#ECF8F4',
    textMuted: '#A5C7BC',
    accent: '#5FC4A3',
    accentSoft: 'rgba(95, 196, 163, 0.18)',
    accentText: '#0A2019',
    star: '#F3B65B',
    shadowColor: 'rgba(0, 0, 0, 0.45)',
  },
  {
    id: 'dark-navy',
    name: 'ดำน้ำเงิน',
    mode: 'dark',
    bg: '#0F141D',
    card: '#171F2C',
    cardSubtle: '#1E2838',
    border: 'rgba(147, 190, 245, 0.16)',
    text: '#EDF3FB',
    textMuted: '#A8B9D0',
    accent: '#71A9EC',
    accentSoft: 'rgba(113, 169, 236, 0.18)',
    accentText: '#0B192B',
    star: '#F3B65B',
    shadowColor: 'rgba(0, 0, 0, 0.48)',
  },
  {
    id: 'dark-purple',
    name: 'ดำม่วง',
    mode: 'dark',
    bg: '#13101B',
    card: '#1C1728',
    cardSubtle: '#251F34',
    border: 'rgba(187, 158, 242, 0.16)',
    text: '#F2EEFB',
    textMuted: '#B8AED1',
    accent: '#A987EA',
    accentSoft: 'rgba(169, 135, 234, 0.18)',
    accentText: '#160E26',
    star: '#F3B65B',
    shadowColor: 'rgba(0, 0, 0, 0.48)',
  },
];

export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = {
  bg: '#FDF6F8',
  card: '#FFFFFF',
  accent: '#D96B91',
  text: '#3A232B',
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) {
    return `rgba(128, 128, 128, ${alpha})`;
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveThemePalette(themeConfig: ThemeConfig): ThemePalette {
  if (themeConfig.presetId !== 'custom') {
    const found = PRESET_THEMES.find((t) => t.id === themeConfig.presetId);
    if (found) return found;
  }

  const c = themeConfig.customColors || DEFAULT_CUSTOM_COLORS;
  const darkMode = isDarkHexColor(c.bg);
  return {
    id: 'custom',
    name: 'สีของร้านเอง',
    mode: darkMode ? 'dark' : 'light',
    bg: c.bg,
    card: c.card,
    cardSubtle: darkMode ? hexToRgba(c.text, 0.06) : hexToRgba(c.accent, 0.07),
    border: hexToRgba(c.text, darkMode ? 0.14 : 0.12),
    text: c.text,
    textMuted: hexToRgba(c.text, 0.72),
    accent: c.accent,
    accentSoft: hexToRgba(c.accent, 0.16),
    accentText: getContrastTextColor(c.accent),
    star: darkMode ? '#F3B65B' : '#E59535',
    shadowColor: darkMode ? 'rgba(0, 0, 0, 0.42)' : hexToRgba(c.accent, 0.16),
  };
}

export function isPresetLight(id: PresetThemeId): boolean {
  return id.startsWith('pastel-');
}
