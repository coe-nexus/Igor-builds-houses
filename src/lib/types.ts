// Types for every JSON in data/. `npm run validate` enforces the shapes; the loaders in data.ts only cast.

export type Bi = { pt: string; en: string };
export type Lang = "pt" | "en";

export const MODEL_IDS = ["k64", "k96", "k96pro", "k144pro", "k144max"] as const;
export type ModelId = (typeof MODEL_IDS)[number];

export const TRACK_IDS = ["prefab", "foundation", "structure", "envelope", "mep", "finishes", "options", "inspection"] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export type HoldBy = "engineer" | "utility" | "owner";

export type Activity = {
  id: string;
  track: TrackId;
  start: number; // working days, 1..working_days, inclusive
  end: number;
  crew: number; // people on this activity while active (0 for cure, buffers, subcontracted)
  pt: string;
  en: string;
  scene_step?: string; // id in scene.steps or scene_factory.steps; the group appears when day >= start
  hold_point?: { pt: string; en: string; by: HoldBy };
  offsite?: true; // prefab track; excluded from crew_by_day
  optional?: true; // options track
  subcontracted?: true;
  risk?: string;
};

export type SceneStep = { id: string; pt: string; en: string };

export type Model = {
  id: ModelId;
  name: Bi;
  footprint: { w: number; l: number; floors: number; ceiling_m: number; bay_m: number };
  area_m2: number;
  system: "steel" | "wood";
  system_label: Bi;
  working_days: 30 | 45; // 45 only for k144max
  crew_peak: number;
  shop_crew: number;
  milestones: Record<string, number>; // day numbers; keys vary by system
  risk_note: Bi;
  land_note: Bi;
  tracks: { id: TrackId; pt: string; en: string }[];
  scene: { builder: "steelChassis" | "woodFrame"; steps: SceneStep[] };
  scene_factory?: { builder: "woodFrameFactory"; steps: SceneStep[] }; // k64 only
  activities: Activity[];
  crew_by_day: number[]; // length working_days, site crew only, generated
  crew_peak_observed: number;
  days_over_peak: number[]; // generated; must be empty
};

// ---- shared ----

export type DueDiligenceStep = {
  id: string;
  weeks: [number, number];
  partner_ids: string[];
  gate: boolean;
  title: Bi;
  pt: string;
  en: string;
};
export type DueDiligence = {
  title: Bi;
  intro: Bi;
  typical_total_weeks: [number, number];
  critical_path: Bi;
  steps: DueDiligenceStep[];
};

export const PARTNER_CATEGORIES = ["engineering", "fabrication", "materials", "lab", "utility", "public", "finance"] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];
export type Partner = {
  id: string;
  name: string | null;
  category: PartnerCategory;
  role: Bi;
  city: string | null;
  url: string | null;
  logo: string | null;
  confirmed: boolean;
};
export type Partners = { title: Bi; note: Bi; partners: Partner[] };

export type RateItem = {
  id: string;
  label: Bi;
  unit: string;
  value: number | null;
  verify: boolean;
  reference: string;
  note?: Bi;
};
export type Rates = {
  title: Bi;
  basis: Bi;
  currency: string;
  public: boolean;
  items: RateItem[];
  house_prices_public: false;
  request_label: Bi;
  market_multiplier_note: { range: [number, number]; pt: string; en: string };
  state: "SC";
};

export type OptionItem = {
  id: string;
  label: Bi;
  added_m2: number;
  retention: number; // 0..1
  scene_step: string | null;
  models: ModelId[];
  why: Bi;
};
export type Options = {
  title: Bi;
  intro: Bi;
  prices_public: false;
  source?: string; // internal provenance, never rendered
  items: OptionItem[];
};

export type MaxExits = {
  title: Bi;
  intro: Bi;
  exits: { id: string; units: number; m2_per_unit: number; label: Bi }[];
  legal: Bi;
  working_days: number;
};

export type TimelapseItem = {
  id: string;
  model: ModelId;
  title: Bi;
  youtube_id: string;
  completed_on: string;
  working_days_actual: number;
  location: string;
};
export type Timelapses = { title: Bi; intro: Bi; items: TimelapseItem[] };

export type CtaTertiary = { label: Bi; bot_entry: string; placement: string };
export type Cta = {
  whatsapp_number_e164: string;
  whatsapp_number_display: string;
  session_name: Bi;
  rules: { primary_max_visible: number; secondary_max_visible: number; placements: string[]; prefill_code: string };
  primary: { label: Bi; sub: Bi; href_template: string; prefill: Bi };
  secondary: { label: Bi; gate: { fields: string[]; consent: Bi }; placement: string };
  tertiary_by_model: Record<ModelId, CtaTertiary>;
  sticky_mobile: { label: Bi; show_after_scroll_pct: number };
  never: string[];
};

export type Brand = {
  name: string;
  alt_names: string[];
  byline: string;
  org: string;
  tagline: Bi;
  primary_host: string;
  future_host: string;
  theme: Record<string, string>;
  track_colors: Record<TrackId, string>;
  fonts: { label: string; body: string };
  disclaimer: Bi;
  investor_disclaimer_counsel_to_approve: Bi & { ru?: string };
  counsel_approved?: boolean; // render the investor disclaimer only when true
};

export type Holidays = {
  note?: string;
  national: Record<string, string[]>;
  municipal: Record<string, Record<string, string[]>>;
};

export type UiStrings = { pt: Record<string, string>; en: Record<string, string> };

export type FaqItem = { id: string; q: Record<string, string>; a: Record<string, string> };
export type FaqFile = { scope: string; items: FaqItem[] };
