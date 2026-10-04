import { useEffect, useState, type FormEvent } from "react";
import { brand, cta, models } from "../../lib/data";
import { whatsappHref, type CtaModel, type Placement } from "../../lib/cta";
import { downloadCsv } from "../../lib/csv";
import { fill, useI18n } from "../../lib/i18n";
import { href } from "../../lib/url";
import { SLUG_OF } from "../../lib/data";
import type { ModelId } from "../../lib/types";
import "./Cta.css";

/** The one primary call to action. Opens WhatsApp with a prefilled message and a [MODEL-PLACEMENT] code. */
export function PrimaryCta({ model, placement }: { model: CtaModel; placement: Extract<Placement, "H" | "B" | "F"> }) {
  const { lang, pick } = useI18n();
  return (
    <a className="cta cta-primary" data-cta="primary" href={whatsappHref(model, placement, lang)} target="_blank" rel="noopener noreferrer">
      <span className="cta-label">{pick(cta.primary.label)}</span>
      <span className="cta-sub">{pick(cta.primary.sub)}</span>
    </a>
  );
}

/** Tertiary entry, one per model (the 64 puts it under the hero; the others after options or the Max exits). */
export function TertiaryCta({ model, where }: { model: ModelId; where: string }) {
  const { lang, pick } = useI18n();
  const entry = cta.tertiary_by_model[model];
  if (entry.placement !== where) return null;
  return (
    <p className="cta-tertiary-wrap">
      <a className="cta cta-tertiary" href={whatsappHref(model, "T", lang, pick(entry.label))} target="_blank" rel="noopener noreferrer">
        {pick(entry.label)}
      </a>
    </p>
  );
}

/** "Request a quote" next to the per m² rates. Prices of houses are never shown. */
export function QuoteCta({ model, label }: { model: CtaModel; label: string }) {
  const { lang } = useI18n();
  return (
    <a className="cta cta-secondary" href={whatsappHref(model, "Q", lang)} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

const FIELD_KEY = { name: "gate_name", email: "gate_email", whatsapp_optional: "gate_whatsapp" } as const;
const FIELD_TYPE = { name: "text", email: "email", whatsapp_optional: "tel" } as const;
const FIELD_AUTOCOMPLETE = { name: "name", email: "email", whatsapp_optional: "tel" } as const;

/** Secondary CTA: the schedule download behind a short gate. The site has no server, so the details travel in the
 *  WhatsApp message the visitor sends; nothing is stored here. Afterwards the CSV and a print-to-PDF view unlock. */
export function ScheduleDownload({ modelId }: { modelId: ModelId }) {
  const { t, lang, pick, tx } = useI18n();
  const model = models[modelId];
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const label = fill(pick(cta.secondary.label), { days: model.working_days });

  useEffect(() => {
    setOpen(false);
    setDone(false);
  }, [modelId]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const lines = cta.secondary.gate.fields
      .map((f) => {
        const value = String(data.get(f) ?? "").trim();
        return value ? `${tx(FIELD_KEY[f as keyof typeof FIELD_KEY])}: ${value}` : "";
      })
      .filter(Boolean);
    window.open(whatsappHref(modelId, "B", lang, [label, ...lines].join("\n")), "_blank", "noopener,noreferrer");
    setDone(true);
  };

  return (
    <div className="gate">
      <button type="button" className="cta cta-secondary" aria-expanded={open} aria-controls="gate-panel" onClick={() => setOpen((v) => !v)}>
        {label}
      </button>
      {open && (
        <div id="gate-panel" className="gate-panel">
          {!done ? (
            <form onSubmit={submit}>
              <h3>{t("gate_title")}</h3>
              {cta.secondary.gate.fields.map((f) => {
                const key = f as keyof typeof FIELD_KEY;
                return (
                  <label key={f}>
                    <span>{tx(FIELD_KEY[key])}</span>
                    <input name={f} type={FIELD_TYPE[key]} autoComplete={FIELD_AUTOCOMPLETE[key]} required={!f.endsWith("_optional")} />
                  </label>
                );
              })}
              <label className="gate-consent">
                <input type="checkbox" required />
                <span>{pick(cta.secondary.gate.consent)}</span>
              </label>
              <p className="gate-note">{t("gate_note")}</p>
              <div className="gate-actions">
                <button type="submit" className="cta cta-primary-sm">
                  {t("gate_submit")}
                </button>
                <button type="button" className="cta cta-link" onClick={() => setOpen(false)}>
                  {t("gate_cancel")}
                </button>
              </div>
            </form>
          ) : (
            <div role="status">
              <h3>{t("gate_done")}</h3>
              <p className="gate-links">
                <button type="button" className="cta cta-secondary" onClick={() => downloadCsv(model, lang)}>
                  {t("download_schedule")}
                </button>
                <a className="cta cta-secondary" href={href(`/print/${SLUG_OF[modelId]}`) + "&print=1"} target="_blank" rel="noopener noreferrer">
                  {t("download_print")}
                </a>
              </p>
              <p className="gate-note">{t("print_hint")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Mobile bar: appears after 30% of the page has scrolled and steps aside whenever a primary CTA is on screen,
 *  so two primaries are never visible at once. */
export function StickyBar({ model }: { model: CtaModel }) {
  const { lang, pick } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [primaryVisible, setPrimaryVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(max > 0 && (window.scrollY / max) * 100 >= cta.sticky_mobile.show_after_scroll_pct);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      setPrimaryVisible(seen.size > 0);
    });
    const watch = () => document.querySelectorAll('[data-cta="primary"]').forEach((el) => io.observe(el));
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  if (!scrolled || primaryVisible) return null;
  return (
    <div className="sticky-bar">
      <a className="cta cta-primary-sm" href={whatsappHref(model, "S", lang)} target="_blank" rel="noopener noreferrer">
        {pick(cta.sticky_mobile.label)}
      </a>
    </div>
  );
}

/** Request access to the financial model (a restricted Google Sheet). Shown only once counsel has approved the
 *  investor disclaimer: brand.json counsel_approved. */
export function ModelAccess({ model }: { model: CtaModel }) {
  const { t, lang } = useI18n();
  if (brand.counsel_approved !== true) return null;
  return (
    <a className="cta cta-link" href={whatsappHref(model, "M", lang)} target="_blank" rel="noopener noreferrer">
      {t("model_access")}
    </a>
  );
}

export { href };
