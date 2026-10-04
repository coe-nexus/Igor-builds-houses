// Working-day calendar (SPEC §4). Dates are ISO strings (YYYY-MM-DD); arithmetic runs on UTC epoch days so
// time zones and daylight saving never move a date.
import type { Holidays } from "./types";

export type ISODate = string;

const MS_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidISO(s: string): boolean {
  const m = ISO_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Days since 1970-01-01 (UTC). */
export function toEpochDay(iso: ISODate): number {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`bad ISO date "${iso}"`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_DAY;
}

export function fromEpochDay(n: number): ISODate {
  return new Date(n * MS_DAY).toISOString().slice(0, 10);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(iso: ISODate): number {
  return new Date(toEpochDay(iso) * MS_DAY).getUTCDay();
}

export type HolidaySet = {
  dates: Set<ISODate>;
  /** Years that have national holiday data. Dates outside these years fall back to weekends only. */
  years: Set<number>;
};

/** National holidays plus one municipality's (default Joinville). */
export function holidaySet(holidays: Holidays, city = "joinville"): HolidaySet {
  const dates = new Set<ISODate>();
  const years = new Set<number>();
  for (const [y, list] of Object.entries(holidays.national)) {
    years.add(Number(y));
    for (const d of list) dates.add(d);
  }
  for (const list of Object.values(holidays.municipal[city] ?? {})) for (const d of list) dates.add(d);
  return { dates, years };
}

export function isWorkingDay(iso: ISODate, hs: HolidaySet): boolean {
  const wd = weekdayOf(iso);
  return wd !== 0 && wd !== 6 && !hs.dates.has(iso);
}

/** The given date if it is a working day, otherwise the next one. */
export function snapToWorkingDay(iso: ISODate, hs: HolidaySet): { date: ISODate; snapped: boolean } {
  let n = toEpochDay(iso);
  let snapped = false;
  while (!isWorkingDay(fromEpochDay(n), hs)) {
    n += 1;
    snapped = true;
  }
  return { date: fromEpochDay(n), snapped };
}

export type CalendarPlan = {
  requestedStart: ISODate;
  /** Day 1: the requested start, moved forward to a working day when it is not one. */
  start: ISODate;
  snapped: boolean;
  /** dates[d - 1] is the calendar date of working day d. */
  dates: ISODate[];
  /** gapsAfter[d - 1] is how many non-working calendar days fall between day d and day d + 1 (0 for the last day). */
  gapsAfter: number[];
  /** Planned handover: the date of the last working day. */
  end: ISODate;
  /** Calendar years the plan touches that have no holiday data (weekends only were skipped there). */
  missingYears: number[];
};

export function planCalendar(requestedStart: ISODate, workingDays: number, hs: HolidaySet): CalendarPlan {
  const { date: start, snapped } = snapToWorkingDay(requestedStart, hs);
  const dates: ISODate[] = [];
  let n = toEpochDay(start);
  while (dates.length < workingDays) {
    const iso = fromEpochDay(n);
    if (isWorkingDay(iso, hs)) dates.push(iso);
    n += 1;
  }
  const gapsAfter = dates.map((d, i) => (i === dates.length - 1 ? 0 : toEpochDay(dates[i + 1]) - toEpochDay(d) - 1));
  const end = dates[dates.length - 1];
  const years = new Set<number>();
  for (let y = Number(start.slice(0, 4)); y <= Number(end.slice(0, 4)); y++) years.add(y);
  const missingYears = [...years].filter((y) => !hs.years.has(y));
  return { requestedStart, start, snapped, dates, gapsAfter, end, missingYears };
}

/** Calendar date of working day `n` (1-based) counting from `start` (snapped forward if needed). */
export function dateOfWorkingDay(start: ISODate, n: number, hs: HolidaySet): ISODate {
  return planCalendar(start, n, hs).end;
}
