import { useEffect, useRef, useState } from "react";
import { brand } from "../../lib/data";
import { useDayStore } from "../../lib/dayStore";
import { useI18n } from "../../lib/i18n";
import type { Model } from "../../lib/types";
import { applySceneState, buildScene, type SceneKind } from "../../scene";
import { SceneViewer } from "../../scene/viewer";
import "./SceneCanvas.css";

/** One three.js canvas for a model. It listens to useDayStore directly, so scrubbing never re-renders React. */
export function SceneCanvas({ model, kind }: { model: Model; kind: SceneKind }) {
  const { t, pick } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const build = buildScene(model, kind);
    let viewer: SceneViewer;
    try {
      viewer = new SceneViewer(el, build, {
        background: brand.theme.bg,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    } catch {
      setFailed(true);
      return;
    }
    const apply = () => {
      const s = useDayStore.getState();
      applySceneState(build, model, kind, { day: s.day, enabledTracks: s.enabledTracks, enabledOptions: s.enabledOptions });
      viewer.invalidate();
    };
    apply();
    const unsubscribe = useDayStore.subscribe(apply);
    return () => {
      unsubscribe();
      viewer.dispose();
    };
  }, [model, kind]);

  return (
    <div className="scene-canvas-host" ref={host} role="img" aria-label={`${t("scene_label")}: ${pick(model.name)}`}>
      {failed && <p className="scene-fallback">{t("scene_unsupported")}</p>}
    </div>
  );
}
