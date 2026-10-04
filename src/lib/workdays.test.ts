import { describe, expect, it } from "vitest";
import holidaysJson from "../../data/shared/holidays.json";
import type { Holidays } from "./types";
import { holidaySet, isValidISO, isWorkingDay, planCalendar, snapToWorkingDay, weekdayOf } from "./workdays";

const holidays = holidaysJson as unknown as Holidays;
const hs = holidaySet(holidays);

// Reference implementation: walk the calendar one date at a time with the JS Date API and the raw JSON,
// sharing no code with workdays.ts.
const skipped = new Set<string>([
  ...Object.values(holidays.national).flat(),
  ...Object.values(holidays.municipal.joinville).flat(),
]);
function referenceDates(startISO: string, count: number): string[] {
  const out: string[] = [];
  const d = new Date(startISO + "T00:00:00Z");
  while (out.length < count) {
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6 && !skipped.has(iso)) out.push(iso);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

describe("working-day calendar", () => {
  it("resolves Day 30 from 2026-11-03 against holidays.json (computed, not hardcoded)", () => {
    const plan = planCalendar("2026-11-03", 30, hs);
    const ref = referenceDates("2026-11-03", 30);
    expect(plan.start).toBe("2026-11-03");
    expect(plan.snapped).toBe(false);
    expect(plan.dates).toEqual(ref);
    expect(plan.end).toBe(ref[29]);
    // 15 Nov is a Sunday and 20 Nov a Friday holiday: the plan must skip the 20th
    expect(plan.dates).not.toContain("2026-11-20");
  });

  it("starts on a Friday before Carnival and skips Monday and Tuesday", () => {
    const plan = planCalendar("2026-02-13", 5, hs);
    expect(weekdayOf("2026-02-13")).toBe(5);
    expect(plan.dates).toEqual(referenceDates("2026-02-13", 5));
    expect(plan.dates).not.toContain("2026-02-16");
    expect(plan.dates).not.toContain("2026-02-17");
    // Sat, Sun, Mon and Tue sit between Day 1 and Day 2
    expect(plan.gapsAfter[0]).toBe(4);
  });

  it("moves a start on a holiday forward to the next working day and says so", () => {
    const plan = planCalendar("2026-11-02", 3, hs); // Finados, a Monday
    expect(plan.snapped).toBe(true);
    expect(plan.start).toBe("2026-11-03");
    expect(plan.requestedStart).toBe("2026-11-02");
  });

  it("moves a Saturday start to Monday", () => {
    const { date, snapped } = snapToWorkingDay("2026-10-03", hs);
    expect(snapped).toBe(true);
    expect(date).toBe("2026-10-05");
    expect(weekdayOf(date)).toBe(1);
  });

  it("moves a Saturday start past a Monday holiday to Tuesday", () => {
    const { date } = snapToWorkingDay("2026-10-10", hs); // Mon 12 Oct is Nossa Senhora Aparecida
    expect(date).toBe("2026-10-13");
  });

  it("rolls over the year, skipping Christmas and New Year", () => {
    const plan = planCalendar("2026-12-14", 30, hs);
    expect(plan.dates).toEqual(referenceDates("2026-12-14", 30));
    expect(plan.dates).not.toContain("2026-12-25");
    expect(plan.dates).not.toContain("2027-01-01");
    expect(plan.end.startsWith("2027")).toBe(true);
    expect(plan.missingYears).toEqual([]);
  });

  it("skips Joinville's municipal date", () => {
    const plan = planCalendar("2026-03-06", 3, hs); // Friday; Monday 9 March is municipal
    expect(plan.dates).not.toContain("2026-03-09");
    expect(plan.dates[1]).toBe("2026-03-10");
  });

  it("falls back to weekends only outside holidays.json and reports the years", () => {
    const plan = planCalendar("2028-03-01", 45, hs);
    expect(plan.missingYears).toContain(2028);
    for (const d of plan.dates) expect([0, 6]).not.toContain(weekdayOf(d));
  });

  it("keeps gaps consistent with the span of the plan", () => {
    for (const [start, n] of [["2026-11-03", 30], ["2026-12-14", 45], ["2026-02-13", 30]] as const) {
      const plan = planCalendar(start, n, hs);
      const span = (Date.parse(plan.end) - Date.parse(plan.start)) / 86_400_000 + 1;
      expect(plan.gapsAfter.reduce((a, b) => a + b, 0) + n).toBe(span);
      expect(plan.gapsAfter.at(-1)).toBe(0);
      expect(plan.dates.every((d) => isWorkingDay(d, hs))).toBe(true);
    }
  });

  it("validates ISO dates strictly", () => {
    expect(isValidISO("2026-11-03")).toBe(true);
    expect(isValidISO("2026-02-30")).toBe(false);
    expect(isValidISO("03/11/2026")).toBe(false);
  });
});
