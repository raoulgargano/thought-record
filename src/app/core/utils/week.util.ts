import {
  addWeeks,
  endOfDay,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';

export interface WeekRange {
  /** Monday 00:00:00 local time */
  start: Date;
  /** Sunday 23:59:59.999 local time */
  end: Date;
}

const WEEK_STARTS_ON = 1;

export function getWeekRange(date: Date = new Date()): WeekRange {
  return {
    start: startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }),
    end: endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }),
  };
}

export function getCurrentWeekRange(): WeekRange {
  return getWeekRange(new Date());
}

export function getNextWeekRange(range: WeekRange): WeekRange {
  return getWeekRange(addWeeks(range.start, 1));
}

export function getPreviousWeekRange(range: WeekRange): WeekRange {
  return getWeekRange(subWeeks(range.start, 1));
}

export function isDateWithinWeek(date: Date, range: WeekRange): boolean {
  return isWithinInterval(date, { start: startOfDay(range.start), end: endOfDay(range.end) });
}

/** Stable string key identifying a week, based on its Monday date (yyyy-MM-dd). */
export function getWeekKey(range: WeekRange): string {
  return format(range.start, 'yyyy-MM-dd');
}

export function getWeekKeyForDate(date: Date): string {
  return getWeekKey(getWeekRange(date));
}

export function formatWeekLabel(range: WeekRange): string {
  const sameYear = range.start.getFullYear() === range.end.getFullYear();
  const sameMonth = sameYear && range.start.getMonth() === range.end.getMonth();
  const startDay = format(range.start, 'd', { locale: es });
  const endDay = format(range.end, 'd', { locale: es });
  const endMonth = format(range.end, 'MMMM', { locale: es });
  const yearSuffix = sameYear ? '' : ` de ${format(range.end, 'yyyy')}`;

  if (sameMonth) {
    return `Semana del ${startDay} al ${endDay} de ${endMonth}${yearSuffix}`;
  }
  const startMonth = format(range.start, 'MMMM', { locale: es });
  return `Semana del ${startDay} de ${startMonth} al ${endDay} de ${endMonth}${yearSuffix}`;
}

export function formatWeekRangeShort(range: WeekRange): string {
  return `${format(range.start, 'dd/MM/yyyy')} al ${format(range.end, 'dd/MM/yyyy')}`;
}

export function formatRecordTimestamp(iso: string): string {
  return format(new Date(iso), 'HH:mm', { locale: es });
}

export function formatRecordDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = subWeeks(today, 0);
  yesterday.setDate(today.getDate() - 1);

  if (isSameCalendarDay(date, today)) {
    return 'Hoy';
  }
  if (isSameCalendarDay(date, yesterday)) {
    return 'Ayer';
  }
  return format(date, "d 'de' MMMM", { locale: es });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weeksAreEqual(a: WeekRange, b: WeekRange): boolean {
  return getWeekKey(a) === getWeekKey(b);
}
