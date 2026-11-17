import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReviewStats,
  chunkString,
  formatDuration,
  formatThaiDateTime,
  getContrastTextColor,
  joinChunks,
  paginateReviews,
  parseYouTubeUrl,
  sortReviewsNewestFirst,
  validateReviewInput,
} from './storeHelpers';
import type { ReviewItem } from '../types/store';

test('calculateReviewStats computes total and rounded average accurately', () => {
  assert.deepEqual(calculateReviewStats([]), { totalCount: 0, averageRating: 0 });
  const sample: ReviewItem[] = [
    { id: '1', name: 'A', product: 'P1', rating: 5, comment: 'ดีมาก', date: '15/11/2026 10:00' },
    { id: '2', name: 'B', product: 'P2', rating: 4, comment: 'น่ารัก', date: '16/11/2026 11:00' },
    { id: '3', name: 'C', product: 'P3', rating: 5, comment: 'ส่งไว', date: '17/11/2026 12:00' },
  ];
  assert.deepEqual(calculateReviewStats(sample), { totalCount: 3, averageRating: 4.7 });
});

test('sortReviewsNewestFirst sorts DD/MM/YYYY HH:mm descending', () => {
  const sample: ReviewItem[] = [
    { id: '1', name: 'Old', product: 'P1', rating: 5, comment: 'c1', date: '01/11/2026 09:00' },
    { id: '2', name: 'Newest', product: 'P2', rating: 5, comment: 'c2', date: '17/11/2026 18:30' },
    { id: '3', name: 'Mid', product: 'P3', rating: 4, comment: 'c3', date: '17/11/2026 08:15' },
  ];
  const sorted = sortReviewsNewestFirst(sample);
  assert.deepEqual(
    sorted.map((r) => r.name),
    ['Newest', 'Mid', 'Old'],
  );
});

test('paginateReviews slices pages and clamps out-of-range page numbers', () => {
  const sample: ReviewItem[] = Array.from({ length: 7 }, (_, i) => ({
    id: `r-${i + 1}`,
    name: `User ${i + 1}`,
    product: 'Item',
    rating: 5,
    comment: 'Great',
    date: '16/11/2026 12:00',
  }));
  const p1 = paginateReviews(sample, 1, 5);
  assert.equal(p1.items.length, 5);
  assert.equal(p1.totalPages, 2);
  assert.equal(p1.currentPage, 1);

  const p2 = paginateReviews(sample, 2, 5);
  assert.equal(p2.items.length, 2);
  assert.equal(p2.currentPage, 2);

  const pClamp = paginateReviews(sample, 99, 5);
  assert.equal(pClamp.currentPage, 2);
});

test('formatThaiDateTime outputs DD/MM/YYYY HH:mm', () => {
  const d = new Date(2026, 10, 5, 9, 7, 0);
  assert.equal(formatThaiDateTime(d), '05/11/2026 09:07');
});

test('parseYouTubeUrl handles watch, youtu.be, shorts, playlist, and invalid URLs', () => {
  assert.deepEqual(parseYouTubeUrl('https://www.youtube.com/watch?v=jfKfPfyJRdk'), {
    type: 'video',
    videoId: 'jfKfPfyJRdk',
  });
  assert.deepEqual(parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), {
    type: 'video',
    videoId: 'dQw4w9WgXcQ',
  });
  assert.deepEqual(parseYouTubeUrl('https://www.youtube.com/shorts/abc123XYZ'), {
    type: 'video',
    videoId: 'abc123XYZ',
  });
  assert.deepEqual(
    parseYouTubeUrl('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'),
    {
      type: 'playlist',
      playlistId: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
    },
  );
  assert.deepEqual(
    parseYouTubeUrl('https://www.youtube.com/watch?v=jfKfPfyJRdk&list=PL12345'),
    {
      type: 'playlist',
      playlistId: 'PL12345',
      videoId: 'jfKfPfyJRdk',
    },
  );
  assert.deepEqual(parseYouTubeUrl('not a youtube url'), { type: 'invalid' });
});

test('formatDuration formats mm:ss cleanly', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(3661), '61:01');
  assert.equal(formatDuration(-5), '0:00');
});

test('chunkString and joinChunks round-trip strings larger than 45000 chars', () => {
  const big = 'A'.repeat(45000) + 'B'.repeat(45000) + 'C'.repeat(1234);
  const chunks = chunkString(big, 45000);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 45000);
  assert.equal(chunks[1].length, 45000);
  assert.equal(chunks[2].length, 1234);
  assert.equal(joinChunks(chunks), big);
});

test('getContrastTextColor picks high-contrast foreground for light vs dark hex', () => {
  assert.equal(getContrastTextColor('#FDF6F8'), '#1F1A1C');
  assert.equal(getContrastTextColor('#161114'), '#FFFFFF');
});

test('validateReviewInput rejects missing fields and accepts valid input', () => {
  const invalid = validateReviewInput({ name: ' ', product: '', rating: 0, comment: '' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.product);
  assert.ok(invalid.errors.rating);
  assert.ok(invalid.errors.comment);

  const valid = validateReviewInput({
    name: 'น้องบีม',
    product: 'กล่องสุ่มพาสเทล',
    rating: 5,
    comment: 'น่ารักมากค่า',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});
