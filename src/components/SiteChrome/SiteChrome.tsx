import { brand } from "../../lib/data";
import { useI18n } from "../../lib/i18n";
import { href } from "../../lib/url";
import { LangToggle } from "../LangToggle";
import "./SiteChrome.css";

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="site-header">
      <a className="site-brand" href={href("/")}>
        {brand.name}
      </a>
      <nav className="site-nav">
        <a href={href("/")}>{t("nav_models")}</a>
        <a href={href("/due-diligence")}>{t("nav_due")}</a>
        <LangToggle />
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const { t, pick } = useI18n();
  return (
    <footer className="site-footer">
      <p className="site-footer-disclaimer">{pick(brand.disclaimer)}</p>
      {brand.counsel_approved === true && (
        <p className="site-footer-disclaimer">{pick(brand.investor_disclaimer_counsel_to_approve)}</p>
      )}
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
