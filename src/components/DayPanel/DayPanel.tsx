import type { Activity, Model, TrackId } from "../../lib/types";
import { useDayStore } from "../../lib/dayStore";
import { fill, useI18n } from "../../lib/i18n";
import { activitiesOn, crewOn, holdPointsOn, shopCrewOn } from "../../lib/schedule";
import "./DayPanel.css";

export function DayPanel({ model }: { model: Model }) {
  const { t, tx, pick, n } = useI18n();
  const day = useDayStore((s) => s.day);
  const selected = useDayStore((s) => s.selectedActivity);
  const trackName = (id: TrackId) => pick(model.tracks.find((x) => x.id === id) ?? { pt: id, en: id });
  const text = (a: Activity) => pick({ pt: a.pt, en: a.en });

  if (day === 0) {
    return (
      <section className="day-panel" aria-live="polite">
        <h3 className="day-title">{t("before_day_one")}</h3>
        <p>{t("day_zero_hint")}</p>
      </section>
    );
  }

  const active = activitiesOn(model, day);
  const holds = holdPointsOn(model, day);
  const crew = crewOn(model, day);
  const shop = shopCrewOn(model, day);

  return (
    <section className="day-panel" aria-live="polite">
      <h3 className="day-title">
        {t("day")} {n(day)} {t("of")} {n(model.working_days)}: {t("today_on_site")}
      </h3>
      <p className="day-crew">
        <strong>{n(crew)}</strong> {t("crew")}
        {shop > 0 && (
          <>
            {" · "}
            <strong>{n(shop)}</strong> {t("shop")}
          </>
        )}
      </p>

      {holds.map((a) => (
        <div className="hold-card" key={a.id}>
          <span className="hold-diamond" aria-hidden="true">◆</span>
          <div>
            <p className="hold-title">{t("hold_point")}</p>
            <p>{pick(a.hold_point!)}</p>
            <p className="hold-by">
              {t("signed_by")}: {tx(`hold_by_${a.hold_point!.by}`)}
            </p>
          </div>
        </div>
      ))}

      {active.length === 0 ? (
        <p>{t("no_activity")}</p>
      ) : (
        <ul className="day-list">
          {active.map((a) => (
            <li key={a.id} className={a.id === selected ? "is-selected" : undefined}>
              <span className="track-chip" style={{ background: `var(--track-${a.track})` }} title={trackName(a.track)} />
              <div>
                <p className="day-item-text">{text(a)}</p>
                <p className="day-item-meta">
                  <span>{trackName(a.track)}</span>
                  {a.crew > 0 && (
                    <span>
                      {fill("{n}", { n: n(a.crew) })} {a.offsite ? t("shop") : t("crew")}
                    </span>
                  )}
                  {a.offsite && <span className="badge">{t("offsite")}</span>}
                  {a.subcontracted && <span className="badge">{t("subcontracted")}</span>}
                  {a.optional && <span className="badge">{t("optional")}</span>}
                  {a.hold_point && a.end !== day && (
                    <span className="badge badge-hold">
                      ◆ {t("hold_point")}: {t("day")} {n(a.end)}
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
