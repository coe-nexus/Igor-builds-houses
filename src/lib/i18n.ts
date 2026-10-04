import { ui, type UiKey } from "./data";
import { useDayStore } from "./dayStore";
import type { Bi, Lang } from "./types";

/** Pick the string for a language from a {pt, en} pair. */
export function pick(bi: Bi, lang: Lang): string {
  return bi[lang];
}

/** UI chrome string by key. Keys are typed from ui.json, so a typo fails typecheck. */
export function t(key: UiKey, lang: Lang): string {
  return ui[lang][key] ?? key;
}

/** PT uses 1.234,5 and EN uses 1,234.5. */
export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en-US").format(n);
}

/** Hook: re-renders on language change and returns bound helpers. */
export function useI18n() {
  const lang = useDayStore((s) => s.lang);
  return {
    lang,
    t: (key: UiKey) => t(key, lang),
    pick: (bi: Bi) => pick(bi, lang),
    n: (value: number) => formatNumber(value, lang),
    tx: (key: string) => tx(key, lang),
    date: (iso: string) => formatDate(iso, lang),
  };
}

/** UI string by a key known only at run time (milestone keys, hold_by_*). Falls back to the key itself. */
export function tx(key: string, lang: Lang): string {
  return ui[lang][key as UiKey] ?? key;
}

/** Replace {name} placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/** "03 nov. 2026" in PT, "03 Nov 2026" in EN. Dates are ISO strings and always rendered in UTC. */
export function formatDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-GB", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso + "T00:00:00Z"),
  );
}
