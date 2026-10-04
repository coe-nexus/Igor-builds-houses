import type { Model } from "../../lib/types";
import { useDayStore } from "../../lib/dayStore";
import { useI18n } from "../../lib/i18n";
import "./TradeToggles.css";

/** One checkbox per track (the layer-toggle pattern). Unchecked tracks leave the Gantt and the scene. */
export function TradeToggles({ model }: { model: Model }) {
  const { t, pick } = useI18n();
  const enabled = useDayStore((s) => s.enabledTracks);
  const toggle = useDayStore((s) => s.toggleTrack);
  return (
    <fieldset className="trades">
      <legend className="eyebrow">{t("tracks")}</legend>
      {model.tracks.map((tr) => (
        <label key={tr.id} className="trade">
          <input type="checkbox" checked={enabled[tr.id]} onChange={() => toggle(tr.id)} />
          <span className="trade-chip" style={{ background: `var(--track-${tr.id})` }} />
          <span>{pick(tr)}</span>
        </label>
      ))}
    </fieldset>
  );
}
