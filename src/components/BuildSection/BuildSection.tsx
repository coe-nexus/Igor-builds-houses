import { useEffect, type KeyboardEvent } from "react";
import type { Model } from "../../lib/types";
import { useDayStore } from "../../lib/dayStore";
import { useI18n } from "../../lib/i18n";
import { CalendarPicker } from "../CalendarPicker";
import { CrewHistogram } from "../CrewHistogram";
import { DayPanel } from "../DayPanel";
import { DayScrubber } from "../DayScrubber";
import { Gantt } from "../Gantt";
import { Milestones } from "../Milestones";
import { SceneArea } from "../SceneArea";
import { TradeToggles } from "../TradeToggles";
import "./BuildSection.css";

const TEXT_INPUTS = new Set(["date", "text", "email", "tel"]);

/** The core of each page: scene and scrubber, day panel, Gantt, crew histogram and milestones, all driven by useDayStore. */
export function BuildSection({ model }: { model: Model }) {
  const { t } = useI18n();
  const playing = useDayStore((s) => s.playing);

  // Autoplay: one day per 800 ms; stepDay stops at the last day.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => useDayStore.getState().stepDay(1), 800);
    return () => window.clearInterval(id);
  }, [playing]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const el = e.target as HTMLElement;
    const tag = el.tagName;
    const type = tag === "INPUT" ? (el as HTMLInputElement).type : "";
    if (tag === "TEXTAREA" || tag === "SELECT" || TEXT_INPUTS.has(type) || e.ctrlKey || e.metaKey || e.altKey) return;
    const range = type === "range"; // the native range input already handles arrows, Home and End
    const { stepDay, setDay, togglePlay, workingDays } = useDayStore.getState();
    switch (e.key) {
      case "ArrowLeft":
        if (!range) { e.preventDefault(); stepDay(-1); }
        break;
      case "ArrowRight":
        if (!range) { e.preventDefault(); stepDay(1); }
        break;
      case "Home":
        if (!range) { e.preventDefault(); setDay(0); }
        break;
      case "End":
        if (!range) { e.preventDefault(); setDay(workingDays); }
        break;
      case " ":
        // Space already activates buttons and checkboxes; everywhere else (and on the range) it toggles autoplay.
        if (range || !(tag === "BUTTON" || tag === "A" || type === "checkbox")) { e.preventDefault(); togglePlay(); }
        break;
    }
  };

  return (
    <section id="build" className="build" aria-labelledby="build-title" onKeyDown={onKeyDown}>
      <header className="build-head">
        <h2 id="build-title">{t("build_title")}</h2>
        <CalendarPicker />
      </header>

      <div className="build-grid">
        <div className="build-left">
          <div className="build-sticky">
            <SceneArea model={model} />
            <DayScrubber />
          </div>
          <DayPanel model={model} />
        </div>
        <div className="build-right">
          <TradeToggles model={model} />
          <Gantt model={model} />
        </div>
      </div>

      <CrewHistogram model={model} />
      <Milestones model={model} />
    </section>
  );
}
