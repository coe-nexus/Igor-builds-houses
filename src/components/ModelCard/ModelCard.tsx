import type { Model } from "../../lib/types";
import { SLUG_OF } from "../../lib/data";
import { useI18n } from "../../lib/i18n";
import { href } from "../../lib/url";
import "./ModelCard.css";

export function ModelCard({ model }: { model: Model }) {
  const { t, pick, n } = useI18n();
  return (
    <a className="model-card" href={href(`/${SLUG_OF[model.id]}`)}>
      <span className="eyebrow">{pick(model.system_label)}</span>
      <h2>{pick(model.name)}</h2>
      <dl>
        <div>
          <dt>{t("area")}</dt>
          <dd>{n(model.area_m2)} m²</dd>
        </div>
        <div>
          <dt>{t("floors")}</dt>
          <dd>{n(model.footprint.floors)}</dd>
        </div>
        <div>
          <dt>{t("weathertight")}</dt>
          <dd>
            {t("day")} {model.milestones.weathertight}
          </dd>
        </div>
        <div>
          <dt>{t("handover")}</dt>
          <dd>
            {t("day")} {model.milestones.handover}
          </dd>
        </div>
      </dl>
    </a>
  );
}
