import { dueDiligence } from "../lib/data";
import { useI18n } from "../lib/i18n";

// P0 placeholder: the shared pipeline component lands in P4.
export function DueDiligencePage() {
  const { pick } = useI18n();
  return (
    <main className="page">
      <section className="page-intro">
        <h1>{pick(dueDiligence.title)}</h1>
        <p>{pick(dueDiligence.intro)}</p>
      </section>
    </main>
  );
}
