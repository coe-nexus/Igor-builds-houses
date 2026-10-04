// Typed loaders for data/*.json. Shapes are enforced by `npm run validate` (CI); here we only cast.
import k64 from "../../data/models/k64.json";
import k96 from "../../data/models/k96.json";
import k96pro from "../../data/models/k96pro.json";
import k144pro from "../../data/models/k144pro.json";
import k144max from "../../data/models/k144max.json";
import brandJson from "../../data/shared/brand.json";
import ctaJson from "../../data/shared/cta.json";
import dueDiligenceJson from "../../data/shared/due-diligence.json";
import holidaysJson from "../../data/shared/holidays.json";
import maxExitsJson from "../../data/shared/max-exits.json";
import optionsJson from "../../data/shared/options.json";
import partnersJson from "../../data/shared/partners.json"; // names of unconfirmed partners are redacted at build time (vite.config.ts)
import ratesJson from "../../data/shared/rates.json";
import timelapsesJson from "../../data/shared/timelapses.json";
import uiJson from "../../data/i18n/ui.json";
import type {
  Brand, Cta, DueDiligence, Holidays, MaxExits, Model, ModelId, Options, Partners, Rates, Timelapses, UiStrings,
} from "./types";

export const models = { k64, k96, k96pro, k144pro, k144max } as unknown as Record<ModelId, Model>;
export const brand = brandJson as unknown as Brand;
export const cta = ctaJson as unknown as Cta;
export const dueDiligence = dueDiligenceJson as unknown as DueDiligence;
export const holidays = holidaysJson as unknown as Holidays;
export const maxExits = maxExitsJson as unknown as MaxExits;
export const options = optionsJson as unknown as Options;
export const partners = partnersJson as unknown as Partners;
export const rates = ratesJson as unknown as Rates;
export const timelapses = timelapsesJson as unknown as Timelapses;
export const ui = uiJson as unknown as UiStrings;
export type UiKey = keyof typeof uiJson.pt;

/** Route slug <-> model id (SPEC §5). */
export const MODEL_SLUGS: Record<string, ModelId> = {
  "64": "k64",
  "96": "k96",
  "96-pro": "k96pro",
  "144-pro": "k144pro",
  "144-max": "k144max",
};
export const SLUG_OF: Record<ModelId, string> = {
  k64: "64",
  k96: "96",
  k96pro: "96-pro",
  k144pro: "144-pro",
  k144max: "144-max",
};
export const MODEL_ORDER: ModelId[] = ["k64", "k96", "k96pro", "k144pro", "k144max"];
