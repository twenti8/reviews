export type ThemeMode = 'light' | 'dark';

export type PresetThemeId =
  | 'pastel-pink'
  | 'pastel-peach'
  | 'pastel-butter'
  | 'pastel-mint'
  | 'pastel-sky'
  | 'pastel-lavender'
  | 'dark-pink'
  | 'dark-peach'
  | 'dark-butter'
  | 'dark-mint'
  | 'dark-navy'
  | 'dark-purple'
  | 'custom';

export interface CustomThemeColors {
  bg: string;
  card: string;
  accent: string;
  text: string;
}

export interface ThemePalette {
  id: PresetThemeId;
  name: string;
  mode: ThemeMode;
  bg: string;
  card: string;
  cardSubtle: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  star: string;
  shadowColor: string;
}

export interface StoreInfo {
  name: string;
  bio: string;
}

export interface MusicConfig {
  youtubeUrl: string;
  title: string;
  coverUrl: string;
}

export interface CreditHighlight {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  product: string;
  rating: number;
  comment: string;
  date: string; // DD/MM/YYYY HH:mm
}

export interface ThemeConfig {
  presetId: PresetThemeId;
  customColors: CustomThemeColors;
}

export interface StoreState {
  storeInfo: StoreInfo;
  theme: ThemeConfig;
  avatarUrl: string;
  bannerUrl: string;
  musicConfig: MusicConfig;
  creditHighlights: CreditHighlight[];
  adminPin: string;
  reviews: ReviewItem[];
}

export type AdminTab = 'store' | 'media' | 'reviews' | 'sheets';
