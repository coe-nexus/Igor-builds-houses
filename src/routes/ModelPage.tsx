import { models } from "../lib/data";
import type { ModelId } from "../lib/types";
import { Hero } from "../components/Hero";

export function ModelPage({ id }: { id: ModelId }) {
  return (
    <main className="page">
      <Hero model={models[id]} />
    </main>
  );
}
