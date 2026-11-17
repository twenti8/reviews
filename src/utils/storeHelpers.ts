import type { ReviewItem } from '../types/store';

export interface YouTubeParseResult {
  type: 'video' | 'playlist' | 'invalid';
  videoId?: string;
  playlistId?: string;
}

export interface ReviewStats {
  totalCount: number;
  averageRating: number;
}

export interface PaginatedReviews {
  items: ReviewItem[];
  totalPages: number;
  currentPage: number;
}

export interface ReviewValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    product?: string;
    rating?: string;
    comment?: string;
  };
}

export function formatThaiDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function parseDateTimeString(dateStr: string): number {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(dateStr.trim());
  if (!match) {
    const fallback = Date.parse(dateStr);
    return Number.isNaN(fallback) ? 0 : fallback;
  }
  const [, dd, mm, yyyy, hh, min] = match;
  return new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    0,
    0,
  ).getTime();
}

export function sortReviewsNewestFirst(reviews: ReviewItem[]): ReviewItem[] {
  return [...reviews].sort((a, b) => {
    const timeDiff = parseDateTimeString(b.date) - parseDateTimeString(a.date);
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });
}

export function calculateReviewStats(reviews: ReviewItem[]): ReviewStats {
  const totalCount = reviews.length;
  if (totalCount === 0) {
    return { totalCount: 0, averageRating: 0 };
  }
  const sum = reviews.reduce((acc, item) => acc + Math.min(5, Math.max(1, Number(item.rating) || 0)), 0);
  const averageRating = Math.round((sum / totalCount) * 10) / 10;
  return { totalCount, averageRating };
}

export function paginateReviews(
  reviews: ReviewItem[],
  page: number,
  pageSize: number = 5,
): PaginatedReviews {
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(reviews.length / safeSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * safeSize;
  return {
    items: reviews.slice(startIndex, startIndex + safeSize),
    totalPages,
    currentPage,
  };
}

export function parseYouTubeUrl(rawUrl: string): YouTubeParseResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { type: 'invalid' };

  let url: URL;
  try {
    url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return { type: 'invalid' };
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const listId = url.searchParams.get('list')?.trim();

  if (host === 'youtu.be') {
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    if (listId && !videoId) {
      return { type: 'playlist', playlistId: listId };
    }
    if (videoId) {
      return listId
        ? { type: 'playlist', playlistId: listId, videoId }
        : { type: 'video', videoId };
    }
    return { type: 'invalid' };
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const pathname = url.pathname;
    if (pathname === '/playlist' && listId) {
      return { type: 'playlist', playlistId: listId };
    }
    const vParam = url.searchParams.get('v')?.trim();
    if (vParam) {
      return listId
        ? { type: 'playlist', playlistId: listId, videoId: vParam }
        : { type: 'video', videoId: vParam };
    }
    const shortsMatch = /^\/(?:shorts|embed|live)\/([^/?#]+)/.exec(pathname);
    if (shortsMatch?.[1]) {
      return listId
        ? { type: 'playlist', playlistId: listId, videoId: shortsMatch[1] }
        : { type: 'video', videoId: shortsMatch[1] };
    }
    if (listId) {
      return { type: 'playlist', playlistId: listId };
    }
  }

  return { type: 'invalid' };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function chunkString(value: string, chunkSize: number = 45000): string[] {
  if (!value) return [''];
  const safeSize = Math.max(1, chunkSize);
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += safeSize) {
    chunks.push(value.slice(i, i + safeSize));
  }
  return chunks;
}

export function joinChunks(chunks: Array<string | number | null | undefined>): string {
  return chunks.map((part) => (part == null ? '' : String(part))).join('');
}

export function isDarkHexColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (full.length !== 6) return false;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  // Relative luminance (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.52;
}

export function getContrastTextColor(bgHex: string): string {
  return isDarkHexColor(bgHex) ? '#FFFFFF' : '#1F1A1C';
}

export function validateReviewInput(input: {
  name: string;
  product: string;
  rating: number;
  comment: string;
}): ReviewValidationResult {
  const errors: ReviewValidationResult['errors'] = {};
  if (!input.name.trim()) {
    errors.name = 'กรุณากรอกชื่อผู้รีวิว';
  }
  if (!input.product.trim()) {
    errors.product = 'กรุณากรอกชื่อสินค้าที่สั่งซื้อ';
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating = 'กรุณาให้คะแนน 1-5 ดาว';
  }
  if (!input.comment.trim()) {
    errors.comment = 'กรุณาเขียนข้อความรีวิว';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
