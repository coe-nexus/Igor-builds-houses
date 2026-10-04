import type { Model } from "../../lib/types";
import { useDayStore } from "../../lib/dayStore";
import { useI18n } from "../../lib/i18n";
import { shopCrewOn } from "../../lib/schedule";
import "./CrewHistogram.css";

/** Crew per day: site crew, with the shop crew stacked lighter on prefab days. Click a bar to jump to that day. */
export function CrewHistogram({ model }: { model: Model }) {
  const { t, n } = useI18n();
  const day = useDayStore((s) => s.day);
  const setDay = useDayStore((s) => s.setDay);
  const wd = model.working_days;
  const rows = Array.from({ length: wd }, (_, i) => {
    const d = i + 1;
    return { d, site: model.crew_by_day[i], shop: shopCrewOn(model, d) };
  });
  const max = Math.max(model.crew_peak, ...rows.map((r) => r.site + r.shop));
  const pct = (v: number) => `${(v / max) * 100}%`;

  return (
    <section className="histogram" aria-labelledby="hist-title">
      <div className="hist-head">
        <h3 id="hist-title" className="eyebrow">{t("histogram_title")}</h3>
        <ul className="hist-legend">
          <li><i className="hl hl-site" />{t("crew")}</li>
          <li><i className="hl hl-shop" />{t("shop")}</li>
          <li><i className="hl hl-peak" />{t("planned_peak")}: {n(model.crew_peak)}</li>
        </ul>
      </div>
      <div className="hist-plot">
        <i className="hist-peak" style={{ bottom: pct(model.crew_peak) }} aria-hidden="true" />
        {rows.map((r) => (
          <button
            key={r.d}
            type="button"
            className={`hist-col${r.d === day ? " is-now" : ""}`}
            tabIndex={r.d === day || (day === 0 && r.d === 1) ? 0 : -1}
            onClick={() => setDay(r.d)}
            aria-label={`${t("go_to_day")} ${r.d}: ${n(r.site)} ${t("crew")}${r.shop ? `, ${n(r.shop)} ${t("shop")}` : ""}`}
            aria-current={r.d === day ? "step" : undefined}
            title={`${t("day")} ${r.d}: ${r.site}${r.shop ? ` + ${r.shop}` : ""}`}
          >
            <span className="hist-stack">
              <span className="hist-shop" style={{ height: pct(r.shop) }} />
              <span className="hist-site" style={{ height: pct(r.site) }} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
