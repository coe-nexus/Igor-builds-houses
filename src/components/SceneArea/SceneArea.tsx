import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { Model } from "../../lib/types";
import { useI18n } from "../../lib/i18n";
// three.js is the bulk of the bundle: load it after first paint
const SceneCanvas = lazy(() => import("../SceneCanvas").then((m) => ({ default: m.SceneCanvas })));
import "./SceneArea.css";

/** True once the element is within 300 px of the viewport (and stays true). three.js, the geometry and the render loop
 *  only start then, so the first screen loads without them. */
function useNear<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return { ref, near };
}

/** The scene pane: one canvas, or for the 64 two canvases (factory and site) on one scrubber. Side by side on
 *  desktop, tabs on mobile; a hidden canvas stops rendering. */
export function SceneArea({ model }: { model: Model }) {
  const { t } = useI18n();
  const { ref, near } = useNear<HTMLDivElement>();
  const [tab, setTab] = useState<"factory" | "site">("factory");

  if (!model.scene_factory) {
    return (
      <div className="scene-area" ref={ref}>
        {near && (
          <Suspense fallback={null}>
            <SceneCanvas model={model} kind="site" />
          </Suspense>
        )}
      </div>
    );
  }
  return (
    <div className="scene-pair" role="group" aria-label={t("both_scenes")} ref={ref}>
      <div className="scene-tabs" role="tablist" aria-label={t("scene_tabs")}>
        {(["factory", "site"] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {t(k === "factory" ? "factory_scene" : "site_scene")}
          </button>
        ))}
      </div>
      <div className="scene-panes">
        <div className="scene-area" data-active={tab === "factory"}>
          {near && (
            <Suspense fallback={null}>
              <SceneCanvas model={model} kind="factory" />
            </Suspense>
          )}
        </div>
        <div className="scene-area" data-active={tab === "site"}>
          {near && (
            <Suspense fallback={null}>
              <SceneCanvas model={model} kind="site" />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
