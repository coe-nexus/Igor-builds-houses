import { useEffect, useState } from "react";
import { MODEL_SLUGS, brand, models } from "./lib/data";
import { useI18n } from "./lib/i18n";
import { syncLangFromUrl } from "./lib/dayStore";
import { readLocation } from "./lib/url";
import { EmbedFooter, SiteFooter, SiteHeader } from "./components/SiteChrome";
import { EMBED, useEmbedHeight } from "./lib/embed";
import { StickyBar } from "./components/Cta";
import type { CtaModel } from "./lib/cta";
import { PrintPage } from "./routes/PrintPage";
import { DueDiligencePage } from "./routes/DueDiligencePage";
import { Home } from "./routes/Home";
import { ModelPage } from "./routes/ModelPage";

// Hash routing (/#/96?lang=en): GitHub Pages and the kiver.org iframe need no server rules or 404.html trick.
function useRoutePath(): string {
  const [path, setPath] = useState(() => readLocation().path);
  useEffect(() => {
    const onChange = () => {
      syncLangFromUrl();
      setPath(readLocation().path);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return path;
}

export function App() {
  const path = useRoutePath();
  useEmbedHeight();
  const { t, pick } = useI18n();
  const modelId = MODEL_SLUGS[path.slice(1)];
  const printId = path.startsWith("/print/") ? MODEL_SLUGS[path.slice(7)] : undefined;

  let page;
  let title: string = brand.name;
  if (printId) {
    page = <PrintPage id={printId} />;
    title = `${pick(models[printId].name)} | ${brand.name}`;
  } else if (path === "/") {
    page = <Home />;
  } else if (path === "/due-diligence") {
    page = <DueDiligencePage />;
  } else if (modelId) {
    page = <ModelPage id={modelId} />;
    title = `${pick(models[modelId].name)} | ${brand.name}`;
  } else {
    page = (
      <main className="page" id="main">
        <h1>{t("not_found")}</h1>
      </main>
    );
  }

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (printId) return page; // the print view carries no site chrome

  const ctaModel: CtaModel = modelId ?? "home";
  if (EMBED) {
    // iframe on kiver.org: no header, no footer chrome, no sticky bar; the disclaimer stays
    return (
      <>
        {page}
        <EmbedFooter />
      </>
    );
  }
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        {t("skip_to_content")}
      </a>
      <SiteHeader />
      {page}
      <SiteFooter model={ctaModel} />
      <StickyBar model={ctaModel} />
    </>
  );
}
