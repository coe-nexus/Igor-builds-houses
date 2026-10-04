import { MODEL_ORDER, brand, models } from "../lib/data";
import { useI18n } from "../lib/i18n";
import { ModelCard } from "../components/ModelCard";
import { PrimaryCta } from "../components/Cta";
import { Faq } from "../components/Faq";

export function Home() {
  const { t, pick } = useI18n();
  return (
    <main className="page" id="main" tabIndex={-1}>
      <section className="page-intro">
        <p className="eyebrow">{brand.name}</p>
        <h1 aria-describedby="tagline-note">{pick(brand.tagline)}</h1>
        <p id="tagline-note" className="tagline-note">
          {pick(brand.tagline_note)}
        </p>
      </section>
      <h2 className="visually-hidden">{t("nav_models")}</h2>
      <div className="card-grid">
        {MODEL_ORDER.map((id) => (
          <ModelCard key={id} model={models[id]} />
        ))}
      </div>
      <div className="page-intro">
        <PrimaryCta model="home" placement="H" />
      </div>
      <Faq model="home" title="faq_home_title" />
    </main>
  );
}
