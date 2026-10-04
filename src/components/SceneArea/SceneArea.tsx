import type { Model } from "../../lib/types";
import { useI18n } from "../../lib/i18n";
import "./SceneArea.css";

// P2 placeholder. P3 replaces the body with the three.js viewers.
export function SceneArea({ model }: { model: Model }) {
  const { t, pick } = useI18n();
  return <div className="scene-area" role="img" aria-label={`${t("scene_label")}: ${pick(model.name)}`} />;
}
