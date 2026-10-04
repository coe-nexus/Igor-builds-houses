import { useI18n } from "../../lib/i18n";
import { faqFor } from "../../lib/faq";
import type { CtaModel } from "../../lib/cta";
import "./Faq.css";

/** Built-in FAQ for a page. Answers come from bot/faq; data/shared/faq-site.json selects which. */
export function Faq({ model, title }: { model: CtaModel; title: "faq_title" | "faq_home_title" }) {
  const { t, lang } = useI18n();
  const entries = faqFor(model, lang);
  if (!entries.length) return null;
  return (
    <section className="block faq" aria-labelledby="faq-title">
      <h2 id="faq-title">{t(title)}</h2>
      <div className="faq-list">
        {entries.map((e) => (
          <details key={e.id}>
            <summary>{e.q}</summary>
            <p>{e.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
