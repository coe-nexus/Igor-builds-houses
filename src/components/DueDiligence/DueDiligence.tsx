import { useState } from "react";
import { dueDiligence, partners } from "../../lib/data";
import { useI18n } from "../../lib/i18n";
import type { DueDiligenceStep } from "../../lib/types";
import { Monogram } from "../Monogram";
import "./DueDiligence.css";

function CameraIcon() {
  return (
    <svg className="dd-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 8h4l1.5-2h7L17 8h4v11H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function useWeeks() {
  const { t, n } = useI18n();
  return (a: number, b: number) => (a === b ? `${n(a)} ${a === 1 ? t("week") : t("weeks")}` : `${n(a)} ${t("range_to")} ${n(b)} ${t("weeks")}`);
}

function Step({ step }: { step: DueDiligenceStep }) {
  const { t, pick } = useI18n();
  const weeksLabel = useWeeks();
  const weeks = weeksLabel(step.weeks[0], step.weeks[1]);
  return (
    <li className="dd-step">
      <div className="dd-step-head">
        <h4>
          {step.id === "cameras" && <CameraIcon />}
          {pick(step.title)}
        </h4>
        <span className="dd-weeks">{weeks}</span>
      </div>
      <p>{pick({ pt: step.pt, en: step.en })}</p>
      {step.partner_ids.length > 0 && (
        <ul className="dd-partners">
          {step.partner_ids.map((id) => {
            const p = partners.partners.find((x) => x.id === id);
            if (!p) return null;
            return (
              <li key={id}>
                <Monogram text={p.confirmed && p.name ? p.name : pick(p.role)} />
                <span>
                  {pick(p.role)}
                  {p.confirmed && p.name ? ` (${p.name})` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {step.gate && <span className="dd-gate">{t("gate")}</span>}
    </li>
  );
}

/** Shared block: identical on all five pages and on /due-diligence. Two lanes: in sequence, and in parallel. */
export function DueDiligence({ heading = "h2" }: { heading?: "h1" | "h2" }) {
  const { t, pick } = useI18n();
  const weeksLabel = useWeeks();
  // Collapsed to a summary bar on a narrow screen; the steps are one tap away.
  const [open, setOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 720);
  const main = dueDiligence.steps.filter((s) => s.lane === "main");
  const parallel = dueDiligence.steps.filter((s) => s.lane === "parallel");
  const H = heading;
  const [min, max] = dueDiligence.typical_total_weeks;
  return (
    <section className="block dd" aria-labelledby="dd-title">
      <H id="dd-title">{pick(dueDiligence.title)}</H>
      <p className="block-note">{pick(dueDiligence.intro)}</p>
      <div className="dd-summary">
        <p>
          <span className="eyebrow">{t("dd_total")}</span> {weeksLabel(min, max)}
        </p>
        <p>
          <span className="eyebrow">{t("dd_critical")}</span> {pick(dueDiligence.critical_path)}
        </p>
        <button type="button" className="dd-toggle" aria-expanded={open} aria-controls="dd-steps" onClick={() => setOpen((v) => !v)}>
          {open ? t("dd_collapse") : t("dd_expand")}
        </button>
      </div>
      <div id="dd-steps" className="dd-lanes" hidden={!open}>
        <div className="dd-lane">
          <h3 className="eyebrow">{t("dd_sequence")}</h3>
          <ol>{main.map((s) => <Step key={s.id} step={s} />)}</ol>
        </div>
        <div className="dd-lane dd-lane-parallel">
          <h3 className="eyebrow">{t("dd_parallel")}</h3>
          <ol>{parallel.map((s) => <Step key={s.id} step={s} />)}</ol>
        </div>
      </div>
      <p className="dd-closing">{t("dd_closing")}</p>
    </section>
  );
}
