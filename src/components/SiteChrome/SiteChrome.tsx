import { brand } from "../../lib/data";
import type { CtaModel } from "../../lib/cta";
import { useI18n } from "../../lib/i18n";
import { href } from "../../lib/url";
import { ModelAccess, PrimaryCta } from "../Cta";
import { LangToggle } from "../LangToggle";
import "./SiteChrome.css";

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="site-header">
      <a className="site-brand" href={href("/")}>
        {brand.name}
      </a>
      <nav className="site-nav" aria-label={brand.name}>
        <a href={href("/")}>{t("nav_models")}</a>
        <a href={href("/due-diligence")}>{t("nav_due")}</a>
        <LangToggle />
      </nav>
    </header>
  );
}

export function SiteFooter({ model }: { model: CtaModel }) {
  const { t, pick } = useI18n();
  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <h2>{t("home_cta_title")}</h2>
        <PrimaryCta model={model} placement="F" />
        <p>
          <ModelAccess model={model} />
        </p>
      </div>
      <p className="site-footer-disclaimer">{pick(brand.disclaimer)}</p>
      {brand.counsel_approved === true && <p className="site-footer-disclaimer">{pick(brand.investor_disclaimer_counsel_to_approve)}</p>}
      <div className="site-footer-row">
        <span className="eyebrow">{brand.name}</span>
        <span>
          {t("by")} {brand.byline}
        </span>
        <a href={href("/")}>{t("nav_home")}</a>
        <LangToggle />
      </div>
    </footer>
  );
}

/** Embed mode: no navigation or footer chrome, but the planning disclaimer stays (SPEC §6). */
export function EmbedFooter() {
  const { pick } = useI18n();
  return (
    <footer className="site-footer embed-footer">
      <p className="site-footer-disclaimer">{pick(brand.disclaimer)}</p>
      {brand.counsel_approved === true && <p className="site-footer-disclaimer">{pick(brand.investor_disclaimer_counsel_to_approve)}</p>}
      <LangToggle />
    </footer>
  );
}
