// WhatsApp calls to action (data/shared/cta.json). Every CTA opens WhatsApp with a prefilled message that carries a
// code like [K96-H]: model and placement. H hero, B after the build, S sticky bar, F footer, T tertiary, plus
// Q (quote request) and M (financial-model access request).
import { brand, cta, models } from "./data";
import { fill } from "./i18n";
import type { Lang, ModelId } from "./types";

export type CtaModel = ModelId | "home";
export type Placement = "H" | "B" | "S" | "F" | "T" | "Q" | "M";

const MODEL_CODE: Record<CtaModel, string> = { k64: "K64", k96: "K96", k96pro: "K96PRO", k144pro: "K144PRO", k144max: "K144MAX", home: "HOME" };

export function prefillCode(model: CtaModel, placement: Placement): string {
  return `[${MODEL_CODE[model]}-${placement}]`;
}

/** The message WhatsApp opens with, in the visitor's language. `extra` is appended on its own line. */
export function prefillText(model: CtaModel, placement: Placement, lang: Lang, extra?: string): string {
  const name = model === "home" ? brand.name : models[model].name[lang];
  const base = fill(cta.primary.prefill[lang], { model_name: name, code: prefillCode(model, placement) });
  return extra ? `${base}\n${extra}` : base;
}

export function whatsappHref(model: CtaModel, placement: Placement, lang: Lang, extra?: string): string {
  return cta.primary.href_template.replace("{prefill}", encodeURIComponent(prefillText(model, placement, lang, extra)));
}
