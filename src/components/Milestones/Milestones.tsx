import type { Model } from "../../lib/types";
import { useDayStore } from "../../lib/dayStore";
import { useI18n } from "../../lib/i18n";
import { milestonesSorted } from "../../lib/schedule";
import "./Milestones.css";

export function Milestones({ model }: { model: Model }) {
  const { t, tx, n } = useI18n();
  const day = useDayStore((s) => s.day);
  const setDay = useDayStore((s) => s.setDay);
  return (
    <section className="milestones" aria-labelledby="ms-title">
      <h3 id="ms-title" className="eyebrow">{t("milestones")}</h3>
      <ol>
        {milestonesSorted(model).map(({ key, day: d }) => (
          <li key={key}>
            <button type="button" className={day >= d ? "is-reached" : undefined} aria-current={day === d ? "step" : undefined} onClick={() => setDay(d)}>
              <span className="ms-day">{t("day")} {n(d)}</span>
              <span className="ms-name">{tx(key)}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
