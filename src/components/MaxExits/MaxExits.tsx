import { maxExits } from "../../lib/data";
import { useI18n } from "../../lib/i18n";
import "./MaxExits.css";

/** The Max only: one house, three exits. No prices. */
export function MaxExits() {
  const { pick, n } = useI18n();
  return (
    <section className="block max-exits" aria-labelledby="exits-title">
      <h2 id="exits-title">{pick(maxExits.title)}</h2>
      <p className="block-note">{pick(maxExits.intro)}</p>
      <ul className="exit-row">
        {maxExits.exits.map((e) => (
          <li key={e.id} className="exit-card">
            <p className="exit-units">{n(e.units)} × {n(e.m2_per_unit)} m²</p>
            <h3>{pick(e.label)}</h3>
          </li>
        ))}
      </ul>
      <p className="block-note">{pick(maxExits.legal)}</p>
    </section>
  );
}
