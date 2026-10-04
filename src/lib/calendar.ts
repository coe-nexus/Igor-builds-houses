import { useMemo } from "react";
import { holidays } from "./data";
import { useDayStore } from "./dayStore";
import { holidaySet, planCalendar, type CalendarPlan } from "./workdays";

const HOLIDAYS = holidaySet(holidays);

/** The calendar plan for the current model, or null in abstract Day 1 to N mode. */
export function useCalendarPlan(): CalendarPlan | null {
  const calendarMode = useDayStore((s) => s.calendarMode);
  const startDate = useDayStore((s) => s.startDate);
  const workingDays = useDayStore((s) => s.workingDays);
  return useMemo(() => (calendarMode && startDate ? planCalendar(startDate, workingDays, HOLIDAYS) : null), [calendarMode, startDate, workingDays]);
}
