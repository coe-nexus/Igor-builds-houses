import { useDayStore } from "../../lib/dayStore";
import { useCalendarPlan } from "../../lib/calendar";
import { fill, useI18n } from "../../lib/i18n";
import { isValidISO } from "../../lib/workdays";
import "./CalendarPicker.css";

export function CalendarPicker() {
  const { t, n, date } = useI18n();
  const calendarMode = useDayStore((s) => s.calendarMode);
  const startDate = useDayStore((s) => s.startDate);
  const workingDays = useDayStore((s) => s.workingDays);
  const setCalendar = useDayStore((s) => s.setCalendar);
  const plan = useCalendarPlan();

  return (
    <div className="calendar-picker">
      <div className="calendar-modes" role="group" aria-label={t("calendar_mode")}>
        <button type="button" aria-pressed={!calendarMode} onClick={() => setCalendar(false)}>
          {fill(t("abstract_days"), { n: n(workingDays) })}
        </button>
        <button type="button" aria-pressed={calendarMode} onClick={() => setCalendar(true)}>
          {t("calendar_mode")}
        </button>
      </div>
      {calendarMode && (
        <label className="calendar-date">
          <span>{t("pick_start")}</span>
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => isValidISO(e.target.value) && setCalendar(true, e.target.value)}
          />
        </label>
      )}
      {plan && (
        <div className="calendar-summary">
          <p>
            <span className="eyebrow">{t("start_date")}</span> {date(plan.start)}
            <span className="calendar-sep" aria-hidden="true">·</span>
            <span className="eyebrow">{t("end_date")}</span> {date(plan.end)}
          </p>
          <p className="calendar-note">{t("skips")}</p>
          {plan.snapped && <p role="status">{fill(t("snapped_notice"), { date: date(plan.start) })}</p>}
          {plan.missingYears.length > 0 && <p role="status">{fill(t("years_warning"), { years: plan.missingYears.join(", ") })}</p>}
        </div>
      )}
    </div>
  );
}
