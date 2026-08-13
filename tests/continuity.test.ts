import { describe, expect, it } from 'vitest';
import { findMissingDates } from '../scripts/check-daily-continuity';

describe('daily continuity', () => {
  it('finds an interior date gap', () => {
    expect(findMissingDates(['2026-06-25', '2026-06-27'])).toEqual(['2026-06-26']);
  });

  it('handles month boundaries and unordered input', () => {
    expect(findMissingDates(['2026-07-01', '2026-06-29', '2026-06-30'])).toEqual([]);
  });

  it('rejects duplicate and invalid calendar dates', () => {
    expect(() => findMissingDates(['2026-06-26', '2026-06-26'])).toThrow(/duplicate/);
    expect(() => findMissingDates(['2026-02-30'])).toThrow(/invalid calendar date/);
    expect(() => findMissingDates(['June-26-2026'])).toThrow(/invalid daily filename/);
  });
});
