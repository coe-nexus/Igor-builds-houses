// Single source of truth for page state (SPEC §9). P0 holds the language only; day, calendar and
// trade toggles join in P2.
import { create } from "zustand";
import type { Lang } from "./types";
import { readLocation, setQueryParam } from "./url";

const STORAGE_KEY = "kiver-build:lang";

function isLang(v: unknown): v is Lang {
  return v === "pt" || v === "en";
}

function initialLang(): Lang {
  const fromUrl = readLocation().query.get("lang");
  if (isLang(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* storage can be blocked (private window, iframe); fall through to the default */
  }
  return "pt";
}

type DayState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

export const useDayStore = create<DayState>((set) => ({
  lang: initialLang(),
  setLang: (lang) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    setQueryParam("lang", lang);
    document.documentElement.lang = lang;
    set({ lang });
  },
}));
