// Single source of truth for page state (SPEC §9): language, the selected build day, calendar mode, trade and
// option toggles. The Gantt, scene, day panel, histogram and the URL (?day=, ?start=) all read from here.
import { create } from "zustand";
import { models } from "./data";
import type { Lang, ModelId, TrackId } from "./types";
import { TRACK_IDS } from "./types";
import { readLocation, setQueryParam } from "./url";
import { isValidISO, type ISODate } from "./workdays";

const STORAGE_KEY = "kiver-build:lang";

function isLang(v: unknown): v is Lang {
  return v === "pt" || v === "en";
}

function initialLang(): Lang {
  const fromUrl = readLocation().query.get("lang");
  if (isLang(fromUrl)) return fromUrl;
  if (typeof window === "undefined") return "pt";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* storage can be blocked (private window, iframe); fall through to the default */
  }
  return "pt";
}

export type TrackFlags = Record<TrackId, boolean>;
const allTracksOn = (): TrackFlags => Object.fromEntries(TRACK_IDS.map((t) => [t, true])) as TrackFlags;

/** Today as an ISO date in the visitor's time zone. */
export function todayISO(): ISODate {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type State = {
  lang: Lang;
  setLang: (lang: Lang) => void;

  modelId: ModelId | null;
  workingDays: number;
  /** 0 means "before Day 1": the empty site with the fence and cameras. */
  day: number;
  selectedActivity: string | null;
  playing: boolean;
  calendarMode: boolean;
  startDate: ISODate | null;
  enabledTracks: TrackFlags;
  /** Option ids switched on; each reveals its scene group from its activity's start day. */
  enabledOptions: Record<string, boolean>;

  enterModel: (id: ModelId) => void;
  setDay: (day: number, activityId?: string | null) => void;
  stepDay: (delta: number) => void;
  togglePlay: () => void;
  setCalendar: (on: boolean, start?: ISODate) => void;
  toggleTrack: (track: TrackId) => void;
  toggleOption: (id: string) => void;
};

export const useDayStore = create<State>((set, get) => ({
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

  modelId: null,
  workingDays: 30,
  day: 0,
  selectedActivity: null,
  playing: false,
  calendarMode: false,
  startDate: null,
  enabledTracks: allTracksOn(),
  enabledOptions: {},

  enterModel: (id) => {
    const wd = models[id].working_days;
    const q = readLocation().query;
    const dayParam = Number(q.get("day"));
    const day = q.has("day") && Number.isInteger(dayParam) ? Math.min(wd, Math.max(0, dayParam)) : wd; // default: the finished house
    const start = q.get("start");
    const calendar = !!start && isValidISO(start);
    set({
      modelId: id,
      workingDays: wd,
      day,
      selectedActivity: null,
      playing: false,
      calendarMode: calendar,
      startDate: calendar ? start : null,
      enabledTracks: allTracksOn(),
      enabledOptions: {},
    });
  },

  setDay: (day, activityId = null) => {
    const { workingDays } = get();
    const d = Math.min(workingDays, Math.max(0, Math.round(day)));
    setQueryParam("day", String(d));
    set({ day: d, selectedActivity: activityId });
  },

  stepDay: (delta) => {
    const { day, workingDays, setDay } = get();
    const next = day + delta;
    if (next >= workingDays) {
      setDay(workingDays);
      set({ playing: false });
    } else setDay(next);
  },

  togglePlay: () => {
    const { playing, day, workingDays, setDay } = get();
    if (!playing && day >= workingDays) setDay(0); // replay from the start
    set({ playing: !playing });
  },

  setCalendar: (on, start) => {
    if (!on) {
      setQueryParam("start", null);
      set({ calendarMode: false, startDate: null });
      return;
    }
    const s = start && isValidISO(start) ? start : (get().startDate ?? todayISO());
    setQueryParam("start", s);
    set({ calendarMode: true, startDate: s });
  },

  toggleTrack: (track) => set((s) => ({ enabledTracks: { ...s.enabledTracks, [track]: !s.enabledTracks[track] } })),
  toggleOption: (id) => set((s) => ({ enabledOptions: { ...s.enabledOptions, [id]: !s.enabledOptions[id] } })),
}));
