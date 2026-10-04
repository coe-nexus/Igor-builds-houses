import { useState } from "react";
import { timelapses } from "../../lib/data";
import { useI18n } from "../../lib/i18n";
import type { ModelId, TimelapseItem } from "../../lib/types";
import "./TimelapseGallery.css";

function Video({ item }: { item: TimelapseItem }) {
  const { t, pick, n, date } = useI18n();
  const [load, setLoad] = useState(false);
  return (
    <li className="tl-card">
      <div className="tl-frame">
        {load ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtube_id)}?autoplay=1&rel=0`}
            title={pick(item.title)}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          // no third-party request until the visitor asks for the video
          <button type="button" onClick={() => setLoad(true)}>
            <span aria-hidden="true">▶</span> {t("load_video")}
          </button>
        )}
      </div>
      <h3>{pick(item.title)}</h3>
      <p>
        {item.location} · {date(item.completed_on)} · {n(item.working_days_actual)} {t("timelapse_days")}
      </p>
    </li>
  );
}

/** Completed builds in time-lapse. The whole section is absent from the DOM while there is nothing to show. */
export function TimelapseGallery({ model }: { model: ModelId }) {
  const { t, pick } = useI18n();
  const own = timelapses.items.filter((i) => i.model === model);
  const items = own.length ? own : timelapses.items; // fall back to every model, with a caption
  if (!items.length) return null;
  return (
    <section className="block timelapse" aria-labelledby="tl-title">
      <h2 id="tl-title">{pick(timelapses.title)}</h2>
      <p className="block-note">{own.length ? pick(timelapses.intro) : t("timelapse_other")}</p>
      <ul className="tl-grid">
        {items.map((i) => (
          <Video key={i.id} item={i} />
        ))}
      </ul>
    </section>
  );
}
