import { DueDiligence } from "../components/DueDiligence";

/** The shared due-diligence block as its own page (SPEC §5). */
export function DueDiligencePage() {
  return (
    <main className="page" id="main" tabIndex={-1}>
      <DueDiligence heading="h1" />
    </main>
  );
}
