import { useState } from "react";
import { partners } from "../../lib/data";
import { useI18n } from "../../lib/i18n";
import { PARTNER_CATEGORIES, type Partner } from "../../lib/types";
import { Monogram } from "../Monogram";
import "./PartnersStrip.css";

function Logo({ partner, fallback }: { partner: Partner; fallback: string }) {
  const [broken, setBroken] = useState(false);
  if (!partner.confirmed || !partner.logo || broken) return <Monogram text={fallback} />;
  return <img className="partner-logo" src={`${import.meta.env.BASE_URL}${partner.logo}`} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

/** Shared block: identical on all five pages. Role first, name second (only when confirmed). */
export function PartnersStrip() {
  const { t, tx, pick } = useI18n();
  return (
    <section className="block partners" aria-labelledby="partners-title">
      <h2 id="partners-title">{pick(partners.title)}</h2>
      <p className="block-note">{pick(partners.note)}</p>
      {PARTNER_CATEGORIES.map((cat) => {
        const list = partners.partners.filter((p) => p.category === cat);
        if (!list.length) return null;
        return (
          <div key={cat} className="partner-group">
            <h3 className="eyebrow">{tx(`cat_${cat}`)}</h3>
            <ul className="partner-row">
              {list.map((p) => {
                const role = pick(p.role);
                const card = (
                  <>
                    <Logo partner={p} fallback={p.confirmed && p.name ? p.name : role} />
                    <span className="partner-text">
                      <span className="partner-role">{role}</span>
                      {p.confirmed && p.name ? (
                        <span className="partner-name">
                          {p.name}
                          {p.city ? `, ${p.city}` : ""}
                        </span>
                      ) : (
                        <span className="partner-tbc">{t("confirm_pending")}</span>
                      )}
                    </span>
                  </>
                );
                return (
                  <li key={p.id}>
                    {p.confirmed && p.url ? (
                      <a className="partner-card" href={p.url} target="_blank" rel="noopener noreferrer">
                        {card}
                      </a>
                    ) : (
                      <div className="partner-card">{card}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
