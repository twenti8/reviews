import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageSquareHeart, Star } from 'lucide-react';
import type { ReviewItem, ThemePalette } from '../types/store';
import {
  formatThaiDateTime,
  paginateReviews,
  sortReviewsNewestFirst,
  validateReviewInput,
} from '../utils/storeHelpers';

interface ReviewSectionProps {
  reviews: ReviewItem[];
  palette: ThemePalette;
  onSubmitReview: (review: ReviewItem) => Promise<void> | void;
}

const REVIEWS_PER_PAGE = 5;

export function ReviewSection({ reviews, palette, onSubmitReview }: ReviewSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [product, setProduct] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    product?: string;
    rating?: string;
    comment?: string;
  }>({});
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedReviews = useMemo(() => sortReviewsNewestFirst(reviews), [reviews]);
  const paginated = useMemo(
    () => paginateReviews(sortedReviews, currentPage, REVIEWS_PER_PAGE),
    [sortedReviews, currentPage],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateReviewInput({ name, product, rating, comment });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const newReview: ReviewItem = {
        id: `rev-${Date.now()}`,
        name: name.trim(),
        product: product.trim(),
        rating,
        comment: comment.trim(),
        date: formatThaiDateTime(new Date()),
      };
      await onSubmitReview(newReview);
      setName('');
      setProduct('');
      setRating(5);
      setComment('');
      setCurrentPage(1);
      setIsFormOpen(false);
      setSubmittedNotice(true);
      setTimeout(() => setSubmittedNotice(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Write Review CTA + Expandable Form */}
      <section
        aria-label="เขียนรีวิวร้าน"
        className="rounded-3xl p-4 sm:p-5"
        style={{
          backgroundColor: palette.card,
          border: `1px solid ${palette.border}`,
          boxShadow: `0 12px 30px -12px ${palette.shadowColor}`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsFormOpen((prev) => !prev);
            setSubmittedNotice(false);
          }}
          aria-expanded={isFormOpen}
          className="w-full min-h-[48px] px-5 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] whitespace-nowrap"
          style={{
            backgroundColor: palette.accent,
            color: palette.accentText,
            boxShadow: `0 10px 22px -8px ${palette.shadowColor}`,
          }}
        >
          <Heart className="w-4 h-4 fill-current shrink-0" />
          <span>กดตรงนี้เพื่อรีวิว ♥</span>
        </button>

        {submittedNotice && (
          <div
            role="status"
            className="mt-3 rounded-2xl px-4 py-2.5 text-xs font-medium text-center"
            style={{
              backgroundColor: palette.accentSoft,
              color: palette.text,
            }}
          >
            ขอบคุณสำหรับรีวิวน่ารักๆ นะคะ! รีวิวขึ้นหน้าร้านเรียบร้อยแล้ว ♡
          </div>
        )}

        {isFormOpen && (
          <form onSubmit={handleSubmit} noValidate className="mt-4 pt-4 flex flex-col gap-3.5" style={{ borderTop: `1px solid ${palette.border}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="review-name"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: palette.text }}
                >
                  ชื่อลูกค้า
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น น้องมิ้นท์ หรือ K.Beam"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: palette.cardSubtle,
                    color: palette.text,
                    border: `1px solid ${errors.name ? '#E11D48' : palette.border}`,
                  }}
                />
                {errors.name && (
                  <p className="text-xs mt-1 text-rose-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="review-product"
                  className="block text-xs font-semibold mb-1.5"
                  style={{ color: palette.text }}
                >
                  ชื่อสินค้าที่สั่งซื้อ
                </label>
                <input
                  id="review-product"
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="เช่น เซตกล่องของขวัญ"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: palette.cardSubtle,
                    color: palette.text,
                    border: `1px solid ${errors.product ? '#E11D48' : palette.border}`,
                  }}
                />
                {errors.product && (
                  <p className="text-xs mt-1 text-rose-500">{errors.product}</p>
                )}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold mb-1.5" style={{ color: palette.text }}>
                ให้คะแนนความพึงพอใจ ({rating}/5 ดาว)
              </span>
              <div className="flex items-center gap-1.5" role="group" aria-label="เลือกคะแนนดาว">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const active = starValue <= rating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      aria-label={`ให้ ${starValue} ดาว`}
                      aria-pressed={rating === starValue}
                      className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-transform active:scale-90"
                      style={{
                        backgroundColor: active ? palette.accentSoft : palette.cardSubtle,
                        color: active ? palette.star : palette.textMuted,
                      }}
                    >
                      <Star className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
                    </button>
                  );
                })}
              </div>
              {errors.rating && (
                <p className="text-xs mt-1 text-rose-500">{errors.rating}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: palette.text }}
              >
                ข้อความรีวิว
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="เล่าความประทับใจหลังได้รับสินค้าได้เลยนะคะ..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
                style={{
                  backgroundColor: palette.cardSubtle,
                  color: palette.text,
                  border: `1px solid ${errors.comment ? '#E11D48' : palette.border}`,
                }}
              />
              {errors.comment && (
                <p className="text-xs mt-1 text-rose-500">{errors.comment}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setErrors({});
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: palette.cardSubtle,
                  color: palette.textMuted,
                }}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity disabled:opacity-60"
                style={{
                  backgroundColor: palette.accent,
                  color: palette.accentText,
                }}
              >
                {isSubmitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิวเลย ♥'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Customer Reviews Feed */}
      <section aria-label="รีวิวจากลูกค้า" className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-4 h-4" style={{ color: palette.accent }} />
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: palette.text }}>
              รีวิวจากลูกค้าที่น่ารัก
            </h2>
          </div>
          <span className="text-xs tabular-nums" style={{ color: palette.textMuted }}>
            หน้า {paginated.currentPage} / {paginated.totalPages}
          </span>
        </div>

        {paginated.items.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              backgroundColor: palette.card,
              border: `1px solid ${palette.border}`,
            }}
          >
            <p className="text-sm font-medium" style={{ color: palette.text }}>
              ยังไม่มีรีวิวในขณะนี้
            </p>
            <p className="text-xs mt-1" style={{ color: palette.textMuted }}>
              มาร่วมเป็นคนแรกที่รีวิวความประทับใจให้ร้านกันนะคะ ♡
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {paginated.items.map((review) => (
              <li
                key={review.id}
                className="rounded-3xl p-4 sm:p-5 transition-transform duration-150"
                style={{
                  backgroundColor: palette.card,
                  border: `1px solid ${palette.border}`,
                  boxShadow: `0 10px 26px -14px ${palette.shadowColor}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: palette.text }}>
                      {review.name}
                    </h3>
                    {/* Unboxed clean metadata with middot separator (Zero-Pill Discipline) */}
                    <p
                      className="text-xs mt-0.5 flex flex-wrap items-center gap-1.5"
                      style={{ color: palette.textMuted }}
                    >
                      <span className="truncate max-w-[210px] sm:max-w-xs">{review.product}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums text-[11px]">{review.date}</span>
                    </p>
                  </div>

                  <div
                    className="flex items-center gap-0.5 shrink-0 pt-0.5"
                    aria-label={`ให้คะแนน ${review.rating} จาก 5 ดาว`}
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-current' : 'opacity-25'}`}
                        style={{ color: s <= review.rating ? palette.star : palette.textMuted }}
                      />
                    ))}
                  </div>
                </div>

                <p
                  className="text-sm leading-relaxed mt-2.5 whitespace-pre-line break-words"
                  style={{ color: palette.text }}
                >
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {paginated.totalPages > 1 && (
          <nav
            aria-label="เปลี่ยนหน้ารีวิว"
            className="flex items-center justify-center gap-2 pt-2"
          >
            <button
              type="button"
              disabled={paginated.currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="หน้าก่อนหน้า"
              className="min-w-[44px] min-h-[44px] px-3 rounded-2xl flex items-center justify-center text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{
                backgroundColor: palette.card,
                color: palette.text,
                border: `1px solid ${palette.border}`,
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: paginated.totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isCurrent = pageNum === paginated.currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  aria-label={`ไปหน้า ${pageNum}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className="min-w-[44px] min-h-[44px] px-3 rounded-2xl text-xs font-semibold tabular-nums transition-colors"
                  style={{
                    backgroundColor: isCurrent ? palette.accent : palette.card,
                    color: isCurrent ? palette.accentText : palette.text,
                    border: `1px solid ${isCurrent ? palette.accent : palette.border}`,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={paginated.currentPage >= paginated.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(paginated.totalPages, p + 1))}
              aria-label="หน้าถัดไป"
              className="min-w-[44px] min-h-[44px] px-3 rounded-2xl flex items-center justify-center text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{
                backgroundColor: palette.card,
                color: palette.text,
                border: `1px solid ${palette.border}`,
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
