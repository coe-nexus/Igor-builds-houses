import { brand, faqSite, faqSources } from "./data";
import type { FaqItem, Lang, ModelId } from "./types";

const BY_ID = new Map<string, FaqItem>(faqSources.flatMap((f) => f.items.map((i) => [i.id, i] as const)));

export type FaqEntry = { id: string; q: string; a: string };

const toEntry = (id: string, lang: Lang): FaqEntry | null => {
  const it = BY_ID.get(id);
  return it ? { id, q: it.q[lang] ?? it.q.pt, a: it.a[lang] ?? it.a.pt } : null;
};

/** Model questions first, then the common ones the model keeps (SPEC: FAQ built into every page). */
export function faqFor(model: ModelId | "home", lang: Lang, counselApproved = brand.counsel_approved === true): FaqEntry[] {
  const ids =
    model === "home"
      ? faqSite.home
      : [...faqSite.by_model[model], ...faqSite.common.filter((id) => !(faqSite.common_exclude[model] ?? []).includes(id))];
  return ids
    .filter((id) => counselApproved || !faqSite.counsel_only.includes(id))
    .map((id) => toEntry(id, lang))
    .filter((e): e is FaqEntry => e !== null);
}
