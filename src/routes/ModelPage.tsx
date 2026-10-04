import { useEffect, useLayoutEffect } from "react";
import { cta, models, rates } from "../lib/data";
import { useDayStore } from "../lib/dayStore";
import { useI18n } from "../lib/i18n";
import type { ModelId } from "../lib/types";
import { BuildSection } from "../components/BuildSection";
import { PrimaryCta, QuoteCta, ScheduleDownload, TertiaryCta } from "../components/Cta";
import { DueDiligence } from "../components/DueDiligence";
import { Faq } from "../components/Faq";
import { Hero } from "../components/Hero";
import { MaxExits } from "../components/MaxExits";
import { OptionsResale } from "../components/OptionsResale";
import { PartnersStrip } from "../components/PartnersStrip";
import { RatesTable } from "../components/RatesTable";
import { TimelapseGallery } from "../components/TimelapseGallery";

export function ModelPage({ id }: { id: ModelId }) {
  const { t, pick } = useI18n();
  const enterModel = useDayStore((s) => s.enterModel);
  const ready = useDayStore((s) => s.modelId === id);
  // Reset day, calendar and toggles for this model before the first paint.
  useLayoutEffect(() => enterModel(id), [id, enterModel]);
  // Our own URL writes use replaceState, which fires no event, so a hashchange means the link was edited or followed:
  // re-read ?day= and ?start=.
  useEffect(() => {
    const onHash = () => enterModel(id);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [id, enterModel]);

  const model = models[id];
  const tertiary = cta.tertiary_by_model[id].placement;
  return (
    <main className="page" id="main" tabIndex={-1}>
      <Hero model={model} />
      <DueDiligence />
      {ready && <BuildSection model={model} />}
      <section className="block after-build" aria-labelledby="after-build-title">
        <h2 id="after-build-title">{t("cta_secondary_title")}</h2>
        <PrimaryCta model={id} placement="B" />
        <ScheduleDownload modelId={id} />
      </section>
      <OptionsResale model={id} />
      {tertiary === "after_options" && <TertiaryCta model={id} where="after_options" />}
      {id === "k144max" && <MaxExits />}
      {tertiary === "after_max_exits" && <TertiaryCta model={id} where="after_max_exits" />}
      <Faq model={id} title="faq_title" />
      <TimelapseGallery model={id} />
      <PartnersStrip />
      <RatesTable />
      <div className="quote-row">
        <QuoteCta model={id} label={pick(rates.request_label)} />
      </div>
    </main>
  );
}
