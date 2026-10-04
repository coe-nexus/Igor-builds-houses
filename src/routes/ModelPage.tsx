import { useEffect, useLayoutEffect } from "react";
import { models } from "../lib/data";
import { useDayStore } from "../lib/dayStore";
import type { ModelId } from "../lib/types";
import { BuildSection } from "../components/BuildSection";
import { Hero } from "../components/Hero";

export function ModelPage({ id }: { id: ModelId }) {
  const enterModel = useDayStore((s) => s.enterModel);
  const ready = useDayStore((s) => s.modelId === id);
  // Reset day, calendar and toggles for this model before the first paint.
  useLayoutEffect(() => enterModel(id), [id, enterModel]);
  // Our own URL writes use replaceState, which fires no event, so a hashchange means the link was edited or followed:
  // re-read ?day= and ?start=.
  useEffect(() => {
    const onHash = () => enterModel(id);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [id, enterModel]);
  return (
    <main className="page">
      <Hero model={models[id]} />
      {ready && <BuildSection model={models[id]} />}
    </main>
  );
}
