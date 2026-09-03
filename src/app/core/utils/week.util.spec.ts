import { describe, expect, it } from 'vitest';
import {
  formatWeekLabel,
  formatWeekRangeShort,
  getNextWeekRange,
  getPreviousWeekRange,
  getWeekKey,
  getWeekRange,
  isDateWithinWeek,
  weeksAreEqual,
} from './week.util';

describe('week.util', () => {
  it('computes a Monday-to-Sunday range for a mid-week date', () => {
    // Wednesday 2 September 2026
    const range = getWeekRange(new Date(2026, 8, 2, 15, 30));
    expect(range.start.getDay()).toBe(1); // Monday
    expect(range.end.getDay()).toBe(0); // Sunday
    expect(range.start.getDate()).toBe(31); // 31 Aug 2026
    expect(range.start.getMonth()).toBe(7);
    expect(range.end.getDate()).toBe(6); // 6 Sep 2026
    expect(range.end.getMonth()).toBe(8);
  });

  it('keeps a Monday date as the start of its own week', () => {
    const monday = new Date(2026, 8, 7, 8, 0);
    const range = getWeekRange(monday);
    expect(range.start.getDate()).toBe(7);
    expect(range.start.getDay()).toBe(1);
  });

  it('keeps a Sunday date as the end of its own week', () => {
    const sunday = new Date(2026, 8, 6, 23, 0);
    const range = getWeekRange(sunday);
    expect(range.end.getDate()).toBe(6);
    expect(range.end.getDay()).toBe(0);
  });

  it('navigates to the next and previous week', () => {
    const range = getWeekRange(new Date(2026, 8, 2));
    const next = getNextWeekRange(range);
    const previous = getPreviousWeekRange(range);

    expect(next.start.getDate()).toBe(7);
    expect(previous.start.getDate()).toBe(24);
    expect(previous.start.getMonth()).toBe(7);
  });

  it('reports whether a date falls inside a week range', () => {
    const range = getWeekRange(new Date(2026, 8, 2));
    expect(isDateWithinWeek(new Date(2026, 7, 31, 0, 5), range)).toBe(true);
    expect(isDateWithinWeek(new Date(2026, 8, 6, 23, 59), range)).toBe(true);
    expect(isDateWithinWeek(new Date(2026, 8, 7, 0, 1), range)).toBe(false);
    expect(isDateWithinWeek(new Date(2026, 7, 30, 23, 59), range)).toBe(false);
  });

  it('builds a stable week key based on the Monday date', () => {
    const range = getWeekRange(new Date(2026, 8, 2));
    expect(getWeekKey(range)).toBe('2026-08-31');
  });

  it('compares two week ranges for equality', () => {
    const a = getWeekRange(new Date(2026, 8, 1));
    const b = getWeekRange(new Date(2026, 8, 5));
    const c = getWeekRange(new Date(2026, 8, 10));
    expect(weeksAreEqual(a, b)).toBe(true);
    expect(weeksAreEqual(a, c)).toBe(false);
  });

  it('formats a human readable week label in Spanish', () => {
    const range = getWeekRange(new Date(2026, 8, 2));
    expect(formatWeekLabel(range)).toBe('Semana del 31 de agosto al 6 de septiembre');
  });

  it('formats a short dd/MM/yyyy range', () => {
    const range = getWeekRange(new Date(2026, 8, 2));
    expect(formatWeekRangeShort(range)).toBe('31/08/2026 al 06/09/2026');
  });
});
