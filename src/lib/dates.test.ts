import { describe, expect, it } from 'vitest';
import { formatDate, formatDateShort, getYear, toISODate } from './dates';

describe('toISODate', () => {
  it('gives a datetime-attribute value', () => {
    expect(toISODate(new Date('2026-03-04T00:00:00Z'))).toBe('2026-03-04');
  });
});

describe('formatDate', () => {
  it('omits the year for the current year', () => {
    expect(formatDate(new Date('2026-03-04T00:00:00Z'), 2026)).toBe('Mar 4');
  });

  it('keeps the year for any other year', () => {
    expect(formatDate(new Date('2024-12-31T00:00:00Z'), 2026)).toBe('Dec 31, 2024');
  });

  it('reads the date in UTC, so a late-evening post keeps its own day', () => {
    expect(formatDate(new Date('2026-03-04T23:30:00Z'), 2026)).toBe('Mar 4');
  });
});

describe('formatDateShort', () => {
  it('always carries the year and pads the day, so rows line up as a column', () => {
    expect(formatDateShort(new Date('2026-10-08T00:00:00Z'))).toBe('Oct 08, 2026');
    expect(formatDateShort(new Date('2022-03-14T00:00:00Z'))).toBe('Mar 14, 2022');
  });

  it('reads the date in UTC', () => {
    expect(formatDateShort(new Date('2026-03-04T23:30:00Z'))).toBe('Mar 04, 2026');
  });
});

describe('getYear', () => {
  it('uses UTC rather than the local zone', () => {
    expect(getYear(new Date('2026-01-01T00:30:00Z'))).toBe(2026);
  });
});
