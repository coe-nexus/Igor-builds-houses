import { options } from "../../lib/data";
import { useDayStore } from "../../lib/dayStore";
import { useI18n } from "../../lib/i18n";
import type { ModelId } from "../../lib/types";
import "./OptionsResale.css";

function Ring({ value }: { value: number }) {
  const r = 18, c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 44 44" width="52" height="52" aria-hidden="true">
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 22 22)" />
    </svg>
  );
}

/** Options and resale retention for one model. An option with a 3D group can be switched on in the scene. */
export function OptionsResale({ model }: { model: ModelId }) {
  const { t, pick, n } = useI18n();
  const enabled = useDayStore((s) => s.enabledOptions);
  const toggle = useDayStore((s) => s.toggleOption);
  const items = options.items.filter((o) => o.models.includes(model));
  if (!items.length) return null;
  return (
    <section className="block options" aria-labelledby="options-title">
      <h2 id="options-title">{pick(options.title)}</h2>
      <p className="block-note">{pick(options.intro)}</p>
      <ul className="option-grid">
        {items.map((o) => {
          const pct = Math.round(o.retention * 100);
          return (
            <li key={o.id} className="option-card">
              <div className="option-top">
                <Ring value={o.retention} />
                <div>
                  <h3>{pick(o.label)}</h3>
                  <p className="option-meta">
                    {t("retention")}: <strong>{n(pct)}%</strong>
                    {o.added_m2 > 0 && (
                      <>
                        {" · "}
                        {t("added_area")}: <strong>+{n(o.added_m2)} m²</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <p>{pick(o.why)}</p>
              {o.scene_step && (
                <button type="button" className="option-toggle" aria-pressed={!!enabled[o.id]} onClick={() => toggle(o.id)}>
                  {t("show_in_scene")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
