import { MODEL_ORDER, brand, models } from "../lib/data";
import { useI18n } from "../lib/i18n";
import { ModelCard } from "../components/ModelCard";

export function Home() {
  const { t, pick } = useI18n();
  return (
    <main className="page">
      <section className="page-intro">
        <p className="eyebrow">{brand.name}</p>
        <h1>{pick(brand.tagline)}</h1>
      </section>
      <h2 className="visually-hidden">{t("nav_models")}</h2>
      <div className="card-grid">
        {MODEL_ORDER.map((id) => (
          <ModelCard key={id} model={models[id]} />
        ))}
      </div>
    </main>
  );
}
