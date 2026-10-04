import { useEffect } from "react";
import { brand, models } from "../lib/data";
import { useCalendarPlan } from "../lib/calendar";
import { useDayStore } from "../lib/dayStore";
import { useI18n } from "../lib/i18n";
import { readLocation } from "../lib/url";
import type { ModelId } from "../lib/types";
import "./PrintPage.css";

/** Clean schedule for "Save as PDF": the browser's print dialog does the rest. `&print=1` opens it straight away. */
export function PrintPage({ id }: { id: ModelId }) {
  const { t, pick, n, date } = useI18n();
  const model = models[id];
  const enterModel = useDayStore((s) => s.enterModel);
  const ready = useDayStore((s) => s.modelId === id);
  useEffect(() => enterModel(id), [id, enterModel]);
  const plan = useCalendarPlan();
  useEffect(() => {
    if (ready && readLocation().query.get("print") === "1") {
      const timer = window.setTimeout(() => window.print(), 300);
      return () => window.clearTimeout(timer);
    }
  }, [ready]);
  if (!ready) return null;
  const track = (tid: string) => pick(model.tracks.find((x) => x.id === tid) ?? { pt: tid, en: tid });
  return (
    <main className="print-page">
      <p className="eyebrow">{brand.name}</p>
      <h1>
        {pick(model.name)}: {t("print_title")}
      </h1>
      <p>
        {n(model.working_days)} {t("working_days")}
        {plan && ` · ${t("start_date")}: ${date(plan.start)} · ${t("end_date")}: ${date(plan.end)}`}
      </p>
      <table>
        <thead>
          <tr>
            <th>{t("col_start")}</th>
            <th>{t("col_end")}</th>
            <th>{t("col_track")}</th>
            <th>{t("col_activity")}</th>
            <th>{t("col_crew")}</th>
          </tr>
        </thead>
        <tbody>
          {[...model.activities]
            .sort((a, b) => a.start - b.start || a.end - b.end)
            .map((a) => (
              <tr key={a.id}>
                <td>{plan ? date(plan.dates[a.start - 1]) : n(a.start)}</td>
                <td>{plan ? date(plan.dates[a.end - 1]) : n(a.end)}</td>
                <td>{track(a.track)}</td>
                <td>
                  {pick({ pt: a.pt, en: a.en })}
                  {a.hold_point && <em> ◆ {pick(a.hold_point)}</em>}
                </td>
                <td>{a.crew}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <p className="print-disclaimer">{pick(brand.disclaimer)}</p>
    </main>
  );
}
