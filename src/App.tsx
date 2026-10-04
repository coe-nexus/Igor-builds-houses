import { useEffect, useState } from "react";
import { MODEL_SLUGS, brand, models } from "./lib/data";
import { useI18n } from "./lib/i18n";
import { readLocation } from "./lib/url";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { DueDiligencePage } from "./routes/DueDiligencePage";
import { Home } from "./routes/Home";
import { ModelPage } from "./routes/ModelPage";

// Hash routing (/#/96?lang=en): GitHub Pages and the kiver.org iframe need no server rules or 404.html trick.
function useRoutePath(): string {
  const [path, setPath] = useState(() => readLocation().path);
  useEffect(() => {
    const onChange = () => setPath(readLocation().path);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return path;
}

export function App() {
  const path = useRoutePath();
  const { t, pick } = useI18n();
  const modelId = MODEL_SLUGS[path.slice(1)];

  let page;
  let title: string = brand.name;
  if (path === "/") {
    page = <Home />;
  } else if (path === "/due-diligence") {
    page = <DueDiligencePage />;
  } else if (modelId) {
    page = <ModelPage id={modelId} />;
    title = `${pick(models[modelId].name)} | ${brand.name}`;
  } else {
    page = (
      <main className="page">
        <h1>{t("not_found")}</h1>
      </main>
    );
  }

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <>
      <SiteHeader />
      {page}
      <SiteFooter />
    </>
  );
}
