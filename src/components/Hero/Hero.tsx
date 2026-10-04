import type { Model } from "../../lib/types";
import { useI18n } from "../../lib/i18n";
import { PrimaryCta, TertiaryCta } from "../Cta";
import "./Hero.css";

// P0 hero: the facts the model data already carries. CTAs, due diligence and the build join in P2 to P4.
export function Hero({ model }: { model: Model }) {
  const { t, pick, n } = useI18n();
  const m = model.milestones;
  return (
    <section className="hero">
      <p className="eyebrow">{pick(model.system_label)}</p>
      <h1>{pick(model.name)}</h1>
      <p className="hero-days">
        {n(model.working_days)} {t("working_days")}
      </p>
      <dl className="facts">
        <div>
          <dt>{t("area")}</dt>
          <dd>{n(model.area_m2)} m²</dd>
        </div>
        <div>
          <dt>{t("floors")}</dt>
          <dd>{n(model.footprint.floors)}</dd>
        </div>
        <div>
          <dt>{t("ceiling")}</dt>
          <dd>{n(model.footprint.ceiling_m)} m</dd>
        </div>
        <div>
          <dt>{t("crew")}</dt>
          <dd>{n(model.crew_peak)}</dd>
        </div>
      </dl>
      <ul className="chips">
        {m.weathertight !== undefined && (
          <li className="chip">
            {t("weathertight")}: {t("day")} {m.weathertight}
          </li>
        )}
        {m.handover !== undefined && (
          <li className="chip">
            {t("handover")}: {t("day")} {m.handover}
          </li>
        )}
      </ul>
      <p className="hero-risk">
        <span className="eyebrow">{t("risk")}</span>
        <br />
        {pick(model.risk_note)}
      </p>
      <div className="hero-cta">
        <PrimaryCta model={model.id} placement="H" />
        <TertiaryCta model={model.id} where="hero_secondary_line" />
      </div>
    </section>
  );
}
