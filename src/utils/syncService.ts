import { DEFAULT_STORE_STATE } from '../data/defaultData';
import type { ReviewItem, StoreState } from '../types/store';
import { resolveActiveSheetUrl } from './storeHelpers';

const STORAGE_STATE_KEY = 'pastel_bio_store_state_v1';
const STORAGE_SHEET_URL_KEY = 'pastel_bio_google_sheet_url_v1';

export function getEnvSheetUrl(): string {
  const envUrl = import.meta.env.VITE_GOOGLE_SHEET_URL;
  return typeof envUrl === 'string' ? envUrl.trim() : '';
}

export function getSavedOverrideSheetUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_SHEET_URL_KEY);
    return typeof saved === 'string' ? saved.trim() : '';
  } catch {
    return '';
  }
}

/**
 * Resolution order:
 * 1. Non-empty URL saved in LocalStorage by Admin (override)
 * 2. Environment Variable VITE_GOOGLE_SHEET_URL (Default for all visitors automatically)
 */
export function getActiveSheetUrl(): string {
  return resolveActiveSheetUrl(getSavedOverrideSheetUrl(), getEnvSheetUrl());
}

export function getInitialSheetUrl(): string {
  return getActiveSheetUrl();
}

export function saveSheetUrl(url: string): string {
  const trimmed = url.trim();
  const envUrl = getEnvSheetUrl();
  try {
    // Only store an override if admin entered a non-empty URL different from env default
    if (trimmed.length > 0 && trimmed !== envUrl) {
      localStorage.setItem(STORAGE_SHEET_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_SHEET_URL_KEY);
    }
  } catch {
    // ignore storage errors
  }
  return getActiveSheetUrl();
}

export function loadLocalStoreState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_STATE_KEY);
    if (!raw) return DEFAULT_STORE_STATE;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return mergeStoreState(DEFAULT_STORE_STATE, parsed);
  } catch {
    return DEFAULT_STORE_STATE;
  }
}

export function saveLocalStoreState(state: StoreState): void {
  try {
    localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors gracefully
  }
}

export function mergeStoreState(base: StoreState, incoming: Partial<StoreState>): StoreState {
  return {
    storeInfo: incoming.storeInfo
      ? {
          name: incoming.storeInfo.name ?? base.storeInfo.name,
          bio: incoming.storeInfo.bio ?? base.storeInfo.bio,
        }
      : base.storeInfo,
    theme: incoming.theme
      ? {
          presetId: incoming.theme.presetId ?? base.theme.presetId,
          customColors: incoming.theme.customColors ?? base.theme.customColors,
        }
      : base.theme,
    avatarUrl: typeof incoming.avatarUrl === 'string' ? incoming.avatarUrl : base.avatarUrl,
    bannerUrl: typeof incoming.bannerUrl === 'string' ? incoming.bannerUrl : base.bannerUrl,
    musicConfig: incoming.musicConfig
      ? {
          youtubeUrl: incoming.musicConfig.youtubeUrl ?? base.musicConfig.youtubeUrl,
          title: incoming.musicConfig.title ?? base.musicConfig.title,
          coverUrl: incoming.musicConfig.coverUrl ?? base.musicConfig.coverUrl,
        }
      : base.musicConfig,
    creditHighlights: Array.isArray(incoming.creditHighlights)
      ? incoming.creditHighlights
      : base.creditHighlights,
    adminPin:
      typeof incoming.adminPin === 'string' && incoming.adminPin.trim()
        ? incoming.adminPin
        : base.adminPin,
    reviews: Array.isArray(incoming.reviews) ? incoming.reviews : base.reviews,
  };
}

function extractSettingsPayload(state: StoreState) {
  return {
    storeInfo: state.storeInfo,
    theme: state.theme,
    avatarUrl: state.avatarUrl,
    bannerUrl: state.bannerUrl,
    musicConfig: state.musicConfig,
    adminPin: state.adminPin,
    creditHighlights: state.creditHighlights,
  };
}

export async function fetchGoogleSheetsPayload(sheetUrl: string): Promise<Partial<StoreState>> {
  const url = sheetUrl.trim() || getActiveSheetUrl();
  if (!url) {
    throw new Error('ยังไม่ได้ตั้งค่า Web App URL หรือ VITE_GOOGLE_SHEET_URL');
  }
  const response = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`เชื่อมต่อ Google Sheets ไม่สำเร็จ (${response.status})`);
  }
  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    settings?: Partial<StoreState>;
    reviews?: ReviewItem[];
  };
  if (data.ok === false) {
    throw new Error(data.error || 'เกิดข้อผิดพลาดในการอ่านข้อมูลจากชีต');
  }

  return {
    ...(data.settings || {}),
    ...(Array.isArray(data.reviews) ? { reviews: data.reviews } : {}),
  };
}

export async function pullFromGoogleSheets(
  sheetUrl: string,
  currentState: StoreState,
): Promise<StoreState> {
  const incoming = await fetchGoogleSheetsPayload(sheetUrl);
  return mergeStoreState(currentState, incoming);
}

async function postToAppsScript(sheetUrl: string, body: Record<string, unknown>): Promise<void> {
  const url = sheetUrl.trim() || getActiveSheetUrl();
  if (!url) return;

  // Use text/plain to prevent CORS preflight OPTIONS failure on Google Apps Script Web Apps
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`ไม่สามารถส่งข้อมูลขึ้น Google Sheets (${response.status})`);
  }

  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { ok?: boolean; error?: string };
    if (parsed.ok === false) {
      throw new Error(parsed.error || 'Google Apps Script แจ้งข้อผิดพลาด');
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      return;
    }
    throw err;
  }
}

export async function pushAllToGoogleSheets(sheetUrl: string, state: StoreState): Promise<void> {
  const url = sheetUrl.trim() || getActiveSheetUrl();
  if (!url) {
    throw new Error('กรุณากรอก Web App URL หรือตั้งค่า VITE_GOOGLE_SHEET_URL ก่อนอัปโหลดข้อมูล');
  }
  await postToAppsScript(url, {
    action: 'syncAll',
    settings: extractSettingsPayload(state),
    reviews: state.reviews,
  });
}

export async function pushSettingsToGoogleSheets(
  sheetUrl: string,
  settings: Partial<ReturnType<typeof extractSettingsPayload>>,
): Promise<void> {
  const url = sheetUrl.trim() || getActiveSheetUrl();
  if (!url) return;
  await postToAppsScript(url, {
    action: 'saveSettings',
    settings,
  });
}

export async function pushNewReviewToGoogleSheets(
  sheetUrl: string,
  review: ReviewItem,
): Promise<void> {
  const url = sheetUrl.trim() || getActiveSheetUrl();
  if (!url) {
    throw new Error('ยังไม่ได้ตั้งค่าลิงก์ Google Sheets สำหรับบันทึกรีวิว');
  }
  await postToAppsScript(url, {
    action: 'addReview',
    review,
  });
}

export async function deleteReviewFromGoogleSheets(sheetUrl: string, id: string): Promise<void> {
  const url = sheetUrl.trim() || getActiveSheetUrl();
  if (!url) return;
  await postToAppsScript(url, {
    action: 'deleteReview',
    id,
  });
}
