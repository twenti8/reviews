import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Settings, Star } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminPinModal } from './components/AdminPinModal';
import { CreditHighlights } from './components/CreditHighlights';
import { ReviewSection } from './components/ReviewSection';
import { SmartImage } from './components/SmartImage';
import { YouTubeMiniPlayer } from './components/YouTubeMiniPlayer';
import { resolveThemePalette } from './data/themes';
import type { ReviewItem, StoreState } from './types/store';
import {
  deleteReviewFromGoogleSheets,
  fetchGoogleSheetsPayload,
  getActiveSheetUrl,
  loadLocalStoreState,
  mergeStoreState,
  pullFromGoogleSheets,
  pushAllToGoogleSheets,
  pushNewReviewToGoogleSheets,
  pushSettingsToGoogleSheets,
  saveLocalStoreState,
  saveSheetUrl,
} from './utils/syncService';
import { calculateReviewStats } from './utils/storeHelpers';

export default function App() {
  const [storeState, setStoreState] = useState<StoreState>(() => loadLocalStoreState());
  const [sheetUrl, setSheetUrl] = useState<string>(() => getActiveSheetUrl());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const syncTimerRef = useRef<number | null>(null);
  const pendingKeysRef = useRef<Set<string>>(new Set());

  const palette = useMemo(() => resolveThemePalette(storeState.theme), [storeState.theme]);
  const stats = useMemo(() => calculateReviewStats(storeState.reviews), [storeState.reviews]);

  // Persist to localStorage whenever storeState updates
  useEffect(() => {
    saveLocalStoreState(storeState);
  }, [storeState]);

  // Sync document background & color-scheme smoothly with theme
  useEffect(() => {
    document.body.style.backgroundColor = palette.bg;
    document.body.style.color = palette.text;
  }, [palette.bg, palette.text]);

  // Dynamically update document.title, Apple Web App title, #app-favicon, and #apple-touch-icon (180x180 PNG via Canvas)
  useEffect(() => {
    const storeName = storeState.storeInfo.name.trim() || 'Mellow Bunny Studio';
    document.title = storeName;

    const appleTitleMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]',
    );
    if (appleTitleMeta) {
      appleTitleMeta.content = storeName;
    }

    const avatarSrc = storeState.avatarUrl.trim();
    if (!avatarSrc) return;

    let cancelled = false;
    const applyIconHref = (href: string) => {
      if (cancelled) return;
      const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
      const appleIconEl = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
      if (faviconEl) faviconEl.href = href;
      if (appleIconEl) appleIconEl.href = href;
    };

    const img = new Image();
    if (!avatarSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 180;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          applyIconHref(avatarSrc);
          return;
        }

        // Center-crop image (object-fit: cover) onto 180x180 canvas
        const scale = Math.max(size / (img.width || size), size / (img.height || size));
        const drawW = (img.width || size) * scale;
        const drawH = (img.height || size) * scale;
        const offsetX = (size - drawW) / 2;
        const offsetY = (size - drawH) / 2;

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        const pngDataUrl = canvas.toDataURL('image/png');
        applyIconHref(pngDataUrl);
      } catch {
        // Fallback if external URL blocks CORS canvas export
        applyIconHref(avatarSrc);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        applyIconHref(avatarSrc);
      }
    };

    img.src = avatarSrc;

    return () => {
      cancelled = true;
    };
  }, [storeState.avatarUrl, storeState.storeInfo.name]);

  // Automatically fetch latest StoreSettings & Reviews (doGet) on page load using LocalStorage override or VITE_GOOGLE_SHEET_URL
  useEffect(() => {
    const activeUrl = sheetUrl.trim() || getActiveSheetUrl();
    if (!activeUrl) return;
    let active = true;
    fetchGoogleSheetsPayload(activeUrl)
      .then((incoming) => {
        if (active) {
          setStoreState((prev) => mergeStoreState(prev, incoming));
        }
      })
      .catch(() => {
        // Keep local fallback gracefully if offline or URL not yet deployed
      });
    return () => {
      active = false;
    };
  }, [sheetUrl]);

  const handleUpdateState = useCallback(
    (updater: (prev: StoreState) => StoreState, syncSettingsKeys?: string[]) => {
      setStoreState((prev) => {
        const next = updater(prev);
        const activeUrl = sheetUrl.trim() || getActiveSheetUrl();
        if (activeUrl && syncSettingsKeys && syncSettingsKeys.length > 0) {
          syncSettingsKeys.forEach((k) => pendingKeysRef.current.add(k));
          if (syncTimerRef.current) {
            window.clearTimeout(syncTimerRef.current);
          }
          syncTimerRef.current = window.setTimeout(() => {
            const payload: Record<string, unknown> = {};
            pendingKeysRef.current.forEach((key) => {
              if (key === 'storeInfo') payload.storeInfo = next.storeInfo;
              if (key === 'theme') payload.theme = next.theme;
              if (key === 'avatarUrl') payload.avatarUrl = next.avatarUrl;
              if (key === 'bannerUrl') payload.bannerUrl = next.bannerUrl;
              if (key === 'musicConfig') payload.musicConfig = next.musicConfig;
              if (key === 'adminPin') payload.adminPin = next.adminPin;
              if (key === 'creditHighlights') payload.creditHighlights = next.creditHighlights;
            });
            pendingKeysRef.current.clear();
            pushSettingsToGoogleSheets(activeUrl, payload).catch(() => {
              // Silent background sync fallback; Admin tab has manual push/pull too
            });
          }, 600);
        }
        return next;
      });
    },
    [sheetUrl],
  );

  const handleSubmitReview = useCallback(
    async (review: ReviewItem) => {
      setStoreState((prev) => ({
        ...prev,
        reviews: [review, ...prev.reviews],
      }));
      const activeUrl = sheetUrl.trim() || getActiveSheetUrl();
      if (activeUrl) {
        try {
          await pushNewReviewToGoogleSheets(activeUrl, review);
        } catch {
          // Keep optimistic local review if network fails transiently
        }
      }
    },
    [sheetUrl],
  );

  const handleDeleteReview = useCallback(
    async (reviewId: string) => {
      setStoreState((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== reviewId),
      }));
      const activeUrl = sheetUrl.trim() || getActiveSheetUrl();
      if (activeUrl) {
        try {
          await deleteReviewFromGoogleSheets(activeUrl, reviewId);
        } catch {
          // ignore transient offline error
        }
      }
    },
    [sheetUrl],
  );

  const handleSaveSheetUrl = useCallback((nextUrl: string) => {
    const resolved = saveSheetUrl(nextUrl);
    setSheetUrl(resolved);
  }, []);

  const handlePullFromSheets = useCallback(
    async (targetUrl: string) => {
      const effectiveUrl = targetUrl.trim() || getActiveSheetUrl();
      const updated = await pullFromGoogleSheets(effectiveUrl, storeState);
      setStoreState(updated);
      handleSaveSheetUrl(targetUrl);
    },
    [storeState, handleSaveSheetUrl],
  );

  const handlePushAllToSheets = useCallback(
    async (targetUrl: string) => {
      const effectiveUrl = targetUrl.trim() || getActiveSheetUrl();
      await pushAllToGoogleSheets(effectiveUrl, storeState);
      handleSaveSheetUrl(targetUrl);
    },
    [storeState, handleSaveSheetUrl],
  );

  return (
    <div
      className="min-h-screen w-full transition-colors duration-200"
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
      }}
    >
      {/* Discreet Corner Admin Entry Button (No theme switchers or edit controls on public storefront) */}
      <div className="max-w-5xl mx-auto px-4 pt-3 sm:px-6 lg:px-8 flex justify-end">
        <button
          type="button"
          onClick={() => setIsPinModalOpen(true)}
          aria-label="จัดการร้าน"
          className="min-h-[38px] px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-transform active:scale-95"
          style={{
            backgroundColor: palette.card,
            color: palette.textMuted,
            border: `1px solid ${palette.border}`,
          }}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>จัดการร้าน</span>
        </button>
      </div>

      {/* Responsive Storefront Shell: Mobile-first bio flow, balanced 2-col layout on Desktop */}
      <main className="max-w-5xl mx-auto px-4 pt-3 pb-16 sm:px-6 lg:px-8 lg:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
          {/* Left Column (Mobile Top Stack): Store Profile + Stats + Mini Music Player + Credit Highlights */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Store Profile Card */}
            <section
              aria-label="โปรไฟล์ร้าน"
              className="rounded-3xl overflow-hidden"
              style={{
                backgroundColor: palette.card,
                border: `1px solid ${palette.border}`,
                boxShadow: `0 16px 38px -14px ${palette.shadowColor}`,
              }}
            >
              {/* Top Banner */}
              <div className="relative h-36 sm:h-44 w-full overflow-hidden">
                <SmartImage
                  src={storeState.bannerUrl}
                  alt={`แบนเนอร์ร้าน ${storeState.storeInfo.name}`}
                  palette={palette}
                  className="w-full h-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
                />
              </div>

              {/* Overlapping Circular Avatar + Cute Frame */}
              <div className="px-5 pb-5 text-center">
                <div className="-mt-12 relative inline-block">
                  <div
                    className="w-24 h-24 rounded-full p-1 shadow-md"
                    style={{
                      backgroundColor: palette.card,
                      border: `2px solid ${palette.accent}`,
                    }}
                  >
                    <SmartImage
                      src={storeState.avatarUrl}
                      alt={`โลโก้ร้าน ${storeState.storeInfo.name}`}
                      palette={palette}
                      className="w-full h-full object-cover rounded-full"
                      fallbackIcon={<Heart className="w-6 h-6" />}
                    />
                  </div>
                </div>

                {/* Store Name */}
                <h1
                  className="mt-3 text-xl sm:text-2xl font-bold tracking-tight"
                  style={{ color: palette.text, textWrap: 'balance' }}
                >
                  {storeState.storeInfo.name || 'ชื่อร้านของคุณ'}
                </h1>

                {/* 3-line Store Bio */}
                <p
                  className="mt-2 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line break-words max-w-md mx-auto"
                  style={{ color: palette.textMuted }}
                >
                  {storeState.storeInfo.bio}
                </p>

                {/* Store Stats Bar */}
                <div
                  aria-label="สถิติร้าน"
                  className="mt-4 pt-4 grid grid-cols-2 gap-3"
                  style={{ borderTop: `1px solid ${palette.border}` }}
                >
                  <div
                    className="rounded-2xl py-2.5 px-3"
                    style={{ backgroundColor: palette.cardSubtle }}
                  >
                    <span
                      className="block text-[11px] font-medium"
                      style={{ color: palette.textMuted }}
                    >
                      รีวิวทั้งหมด
                    </span>
                    <span
                      className="mt-0.5 block text-lg font-bold tabular-nums"
                      style={{ color: palette.text }}
                    >
                      {stats.totalCount}
                    </span>
                  </div>

                  <div
                    className="rounded-2xl py-2.5 px-3"
                    style={{ backgroundColor: palette.cardSubtle }}
                  >
                    <span
                      className="block text-[11px] font-medium"
                      style={{ color: palette.textMuted }}
                    >
                      คะแนนร้าน
                    </span>
                    <span
                      className="mt-0.5 flex items-center justify-center gap-1 text-lg font-bold tabular-nums"
                      style={{ color: palette.text }}
                    >
                      <Star
                        className="w-4 h-4 fill-current shrink-0"
                        style={{ color: palette.star }}
                      />
                      <span>
                        {stats.totalCount > 0 ? stats.averageRating.toFixed(1) : '0.0'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Cute Pastel Mini Music Player */}
            <YouTubeMiniPlayer config={storeState.musicConfig} palette={palette} />

            {/* Customer Credit Story Highlights */}
            <CreditHighlights highlights={storeState.creditHighlights} palette={palette} />
          </div>

          {/* Right Column (Mobile Bottom Stack): Review Submission & Paginated Customer Reviews */}
          <div className="lg:col-span-7">
            <ReviewSection
              reviews={storeState.reviews}
              palette={palette}
              onSubmitReview={handleSubmitReview}
            />
          </div>
        </div>
      </main>

      {/* PIN Gate Modal */}
      {isPinModalOpen && (
        <AdminPinModal
          expectedPin={storeState.adminPin}
          palette={palette}
          onUnlock={() => {
            setIsPinModalOpen(false);
            setIsAdminOpen(true);
          }}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}

      {/* Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard
          state={storeState}
          palette={palette}
          sheetUrl={sheetUrl}
          onUpdateState={handleUpdateState}
          onDeleteReview={handleDeleteReview}
          onSaveSheetUrl={handleSaveSheetUrl}
          onPullFromSheets={handlePullFromSheets}
          onPushAllToSheets={handlePushAllToSheets}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}
