import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, X } from 'lucide-react';
import type { CreditHighlight, ThemePalette } from '../types/store';
import { SmartImage } from './SmartImage';

interface CreditHighlightsProps {
  highlights: CreditHighlight[];
  palette: ThemePalette;
}

export function CreditHighlights({ highlights, palette }: CreditHighlightsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev + 1) % highlights.length,
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + highlights.length) % highlights.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, highlights.length]);

  const activeItem = activeIndex !== null ? highlights[activeIndex] : null;

  return (
    <section
      aria-label="เครดิตลูกค้า"
      className="rounded-3xl p-4 sm:p-5"
      style={{
        backgroundColor: palette.card,
        border: `1px solid ${palette.border}`,
        boxShadow: `0 12px 30px -12px ${palette.shadowColor}`,
      }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold tracking-tight" style={{ color: palette.text }}>
          เครดิตลูกค้า ♡
        </h2>
        <span className="text-xs tabular-nums" style={{ color: palette.textMuted }}>
          {highlights.length} รายการ
        </span>
      </div>

      {highlights.length === 0 ? (
        <p className="text-xs py-3 text-center" style={{ color: palette.textMuted }}>
          ยังไม่มีรูปเครดิตลูกค้าในขณะนี้
        </p>
      ) : (
        <div className="flex items-start gap-3.5 overflow-x-auto no-scrollbar pb-1">
          {highlights.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`เปิดดูเครดิต: ${item.caption || `รายการที่ ${idx + 1}`}`}
              className="group flex flex-col items-center gap-1.5 shrink-0 w-[72px] focus-visible:outline-2 focus-visible:outline-offset-2 rounded-2xl p-1 transition-transform active:scale-95"
            >
              <span
                className="w-16 h-16 rounded-full p-[2.5px] transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentSoft})`,
                }}
              >
                <span
                  className="block w-full h-full rounded-full overflow-hidden p-[2px]"
                  style={{ backgroundColor: palette.card }}
                >
                  <SmartImage
                    src={item.imageUrl}
                    alt={item.caption || `เครดิตลูกค้า ${idx + 1}`}
                    palette={palette}
                    className="w-full h-full object-cover rounded-full"
                    fallbackIcon={<Heart className="w-4 h-4" />}
                  />
                </span>
              </span>
              <span
                className="text-[11px] leading-tight text-center truncate w-full"
                style={{ color: palette.textMuted }}
              >
                {item.caption || `สลิป #${idx + 1}`}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activeItem && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ดูรูปเครดิตลูกค้าแบบเต็มจอ"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative w-full max-w-lg flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white/90 px-1">
              <span className="text-xs font-mono tabular-nums">
                {activeIndex + 1} / {highlights.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="ปิดหน้าต่างรูปภาพ"
                className="min-w-[44px] min-h-[44px] rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-[3/4] max-h-[75vh] rounded-3xl overflow-hidden bg-black/40 flex items-center justify-center">
              <SmartImage
                src={activeItem.imageUrl}
                alt={activeItem.caption || 'รูปเครดิตลูกค้า'}
                palette={palette}
                className="w-full h-full object-contain"
              />

              {highlights.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((activeIndex - 1 + highlights.length) % highlights.length)
                    }
                    aria-label="รูปเครดิตก่อนหน้า"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((activeIndex + 1) % highlights.length)}
                    aria-label="รูปเครดิตถัดไป"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {activeItem.caption && (
              <p className="text-sm text-white/95 text-center font-medium px-3">
                {activeItem.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
