import { useDayStore } from "../../lib/dayStore";
import { useCalendarPlan } from "../../lib/calendar";
import { useI18n } from "../../lib/i18n";
import "./DayScrubber.css";

export function DayScrubber() {
  const { t, n, date } = useI18n();
  const day = useDayStore((s) => s.day);
  const workingDays = useDayStore((s) => s.workingDays);
  const playing = useDayStore((s) => s.playing);
  const setDay = useDayStore((s) => s.setDay);
  const stepDay = useDayStore((s) => s.stepDay);
  const togglePlay = useDayStore((s) => s.togglePlay);
  const plan = useCalendarPlan();

  const label = day === 0 ? t("before_day_one") : `${t("day")} ${n(day)} ${t("of")} ${n(workingDays)}`;
  const when = plan && day >= 1 ? date(plan.dates[day - 1]) : "";

  return (
    <div className="scrubber">
      <div className="scrubber-row">
        <button type="button" className="scrub-btn" onClick={() => stepDay(-1)} disabled={day <= 0} aria-label={t("prev_day")}>
          ‹
        </button>
        <input
          type="range"
          className="scrub-range"
          min={0}
          max={workingDays}
          step={1}
          value={day}
          aria-label={t("scrubber_label")}
          aria-valuetext={when ? `${label}, ${when}` : label}
          onChange={(e) => setDay(Number(e.target.value))}
        />
        <button type="button" className="scrub-btn" onClick={() => stepDay(1)} disabled={day >= workingDays} aria-label={t("next_day")}>
          ›
        </button>
        <button type="button" className="scrub-btn scrub-play" onClick={togglePlay} aria-pressed={playing} aria-label={playing ? t("pause") : t("play")}>
          {playing ? "❚❚" : "▶"}
        </button>
      </div>
      <p className="scrub-label" aria-live="polite">
        <span className="scrub-day">{label}</span>
        {when && <span className="scrub-date">{when}</span>}
      </p>
      <p className="scrub-hint">{t("scrub_hint")}</p>
    </div>
  );
}
