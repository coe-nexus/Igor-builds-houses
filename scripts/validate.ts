// npm run validate: loads every JSON in data/ and bot/faq/ and enforces SPEC §3 and §15.
// Errors exit 1; warnings are printed and do not fail. Generation stays in Python; this regenerates nothing.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  Activity, Brand, Cta, DueDiligence, FaqFile, Holidays, MaxExits, Model, Options, Partners, Rates, Timelapses, UiStrings,
} from "../src/lib/types";
import { MODEL_IDS, PARTNER_CATEGORIES, TRACK_IDS } from "../src/lib/types";

const root = fileURLToPath(new URL("..", import.meta.url));
const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);
const load = <T>(rel: string): T => JSON.parse(readFileSync(root + rel, "utf8")) as T;
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isBi = (v: unknown): boolean => !!v && typeof v === "object" && isStr((v as any).pt) && isStr((v as any).en);

/** Every object that carries a pt or en key must carry both, non-empty. */
function walkBi(v: unknown, where: string): void {
  if (Array.isArray(v)) return v.forEach((x, i) => walkBi(x, `${where}[${i}]`));
  if (!v || typeof v !== "object") return;
  const o = v as Record<string, unknown>;
  if ("pt" in o || "en" in o) {
    for (const l of ["pt", "en"]) if (!isStr(o[l])) err(where, `missing or empty "${l}"`);
  }
  for (const [k, x] of Object.entries(o)) walkBi(x, `${where}.${k}`);
}

const ui = load<UiStrings>("data/i18n/ui.json");
const brand = load<Brand>("data/shared/brand.json");
const cta = load<Cta>("data/shared/cta.json");
const dd = load<DueDiligence>("data/shared/due-diligence.json");
const holidays = load<Holidays>("data/shared/holidays.json");
const maxExits = load<MaxExits>("data/shared/max-exits.json");
const options = load<Options>("data/shared/options.json");
const partners = load<Partners>("data/shared/partners.json");
const rates = load<Rates>("data/shared/rates.json");
const timelapses = load<Timelapses>("data/shared/timelapses.json");
const models = Object.fromEntries(MODEL_IDS.map((id) => [id, load<Model>(`data/models/${id}.json`)])) as Record<(typeof MODEL_IDS)[number], Model>;
const faqFiles = readdirSync(root + "bot/faq").filter((f) => f.endsWith(".json")).sort();

// Bilingual completeness everywhere except ui.json (checked below as two flat dictionaries).
for (const id of MODEL_IDS) walkBi(models[id], `models/${id}`);
for (const [name, v] of Object.entries({ brand, cta, dueDiligence: dd, maxExits, options, partners, rates, timelapses })) walkBi(v, `shared/${name}`);

// ---- ui.json ----
{
  const pt = Object.keys(ui.pt).sort();
  const en = Object.keys(ui.en).sort();
  for (const k of pt) if (!(k in ui.en)) err("ui.json", `key "${k}" missing in en`);
  for (const k of en) if (!(k in ui.pt)) err("ui.json", `key "${k}" missing in pt`);
  for (const l of ["pt", "en"] as const) for (const [k, v] of Object.entries(ui[l])) if (!isStr(v)) err("ui.json", `${l}.${k} is empty`);
}

// ---- models (SPEC §3.1) ----
const HOLD_MILESTONES = new Set(["assembly", "structure_done", "weathertight", "mep_tested", "handover"]);
for (const id of MODEL_IDS) {
  const m = models[id];
  const w = `models/${id}`;
  if (m.id !== id) err(w, `id "${m.id}" does not match the file name`);
  if (m.system !== "steel" && m.system !== "wood") err(w, `system "${m.system}"`);
  const wd = m.working_days;
  if (id === "k144max" ? wd !== 45 : wd !== 30) err(w, `working_days is ${wd}; expected ${id === "k144max" ? 45 : 30}`);
  if (m.system === "steel" && m.scene.builder !== "steelChassis") err(w, "steel models use the steelChassis builder");
  if (m.system === "wood" && m.scene.builder !== "woodFrame") err(w, "wood models use the woodFrame builder");
  if ((id === "k64") !== !!m.scene_factory) err(w, "scene_factory is for k64 only, and k64 must have it");
  if (m.tracks.map((t) => t.id).join() !== TRACK_IDS.join()) err(w, "tracks must be the eight TrackIds in order");
  for (const t of ["area_m2", "crew_peak", "shop_crew"] as const) if (!isNum(m[t])) err(w, `${t} must be a number`);

  const trackIds = new Set<string>(m.tracks.map((t) => t.id));
  const seen = new Set<string>();
  const steps = new Set([...m.scene.steps.map((s) => s.id), ...(m.scene_factory?.steps ?? []).map((s) => s.id)]);
  const referenced = new Set<string>();
  const load_ = new Array(wd + 1).fill(0);
  for (const a of m.activities as Activity[]) {
    const aw = `${w}/${a.id}`;
    if (seen.has(a.id)) err(aw, "duplicate activity id");
    seen.add(a.id);
    if (!trackIds.has(a.track)) err(aw, `unknown track "${a.track}"`);
    if (!(Number.isInteger(a.start) && Number.isInteger(a.end) && 1 <= a.start && a.start <= a.end && a.end <= wd)) err(aw, `bad range ${a.start}..${a.end} for ${wd} working days`);
    if (!(Number.isInteger(a.crew) && a.crew >= 0)) err(aw, `bad crew ${a.crew}`);
    if (a.offsite && a.track !== "prefab") err(aw, "offsite activities belong to the prefab track");
    if (a.hold_point && !["engineer", "utility", "owner"].includes(a.hold_point.by)) err(aw, `hold_point.by "${a.hold_point.by}"`);
    if (a.scene_step) {
      referenced.add(a.scene_step);
      if (!steps.has(a.scene_step)) err(aw, `scene_step "${a.scene_step}" is not in scene.steps or scene_factory.steps`);
    }
    if (!a.offsite) for (let d = a.start; d <= Math.min(a.end, wd); d++) load_[d] += a.crew;
  }
  for (const s of steps) if (!referenced.has(s)) err(w, `scene step "${s}" is not referenced by any activity`);

  if (m.crew_by_day.length !== wd) err(w, `crew_by_day has ${m.crew_by_day.length} entries; expected ${wd}`);
  for (let d = 1; d <= wd; d++) if (m.crew_by_day[d - 1] !== load_[d]) err(w, `crew_by_day[day ${d}] is ${m.crew_by_day[d - 1]}; the activities sum to ${load_[d]}`);
  const peak = Math.max(...load_.slice(1));
  if (peak > m.crew_peak) err(w, `observed peak ${peak} exceeds crew_peak ${m.crew_peak}`);
  if (m.crew_peak_observed !== peak) err(w, `crew_peak_observed is ${m.crew_peak_observed}; computed ${peak}`);
  if (m.days_over_peak.length) err(w, `days_over_peak is not empty: ${m.days_over_peak.join(",")}`);

  for (const [key, day] of Object.entries(m.milestones)) {
    const mw = `${w}/milestone:${key}`;
    if (!(key in ui.pt && key in ui.en)) err(mw, `no label in ui.json for milestone "${key}"`);
    const ending = m.activities.filter((a) => a.end === day);
    if (!ending.length) err(mw, `day ${day} is not the end of any activity`);
    else if (HOLD_MILESTONES.has(key) && !ending.some((a) => a.hold_point)) err(mw, `day ${day} ends no activity with a hold_point`);
    else if (!HOLD_MILESTONES.has(key) && !["ring", "pour"].includes(key)) warn(mw, "unknown milestone key; add it to HOLD_MILESTONES or the exemptions in validate.ts");
  }
  if (m.milestones.handover !== wd) err(w, `handover is day ${m.milestones.handover}; expected ${wd}`);
}

// ---- shared ----
{
  const ids = new Set<string>();
  for (const p of partners.partners) {
    const w = `partners/${p.id}`;
    if (ids.has(p.id)) err(w, "duplicate id");
    ids.add(p.id);
    if (!(PARTNER_CATEGORIES as readonly string[]).includes(p.category)) err(w, `unknown category "${p.category}"`);
    if (!isBi(p.role)) err(w, "role must be {pt, en}");
    if (typeof p.confirmed !== "boolean") err(w, "confirmed must be a boolean");
    if (p.confirmed && !p.name) err(w, "confirmed:true needs a name");
    if (!p.confirmed && p.logo) err(w, "an unconfirmed partner must not have a logo");
    if (p.logo && !existsSync(root + "public/" + p.logo)) warn(w, `logo file public/${p.logo} not found`);
  }
  const stepIds = new Set<string>();
  for (const s of dd.steps) {
    const w = `due-diligence/${s.id}`;
    if (stepIds.has(s.id)) err(w, "duplicate id");
    stepIds.add(s.id);
    if (!(isNum(s.weeks?.[0]) && isNum(s.weeks?.[1]) && s.weeks[0] <= s.weeks[1])) err(w, "weeks must be [min, max]");
    if (typeof s.gate !== "boolean") err(w, "gate must be a boolean");
    if (!isBi(s.title)) err(w, "title must be {pt, en}");
    for (const pid of s.partner_ids) if (!ids.has(pid)) err(w, `partner_id "${pid}" not in partners.json`);
  }
  if (!(dd.typical_total_weeks?.length === 2)) err("due-diligence", "typical_total_weeks must be [min, max]");
  if (dd.steps.length !== 11) warn("due-diligence", `${dd.steps.length} steps; SPEC §6 describes 11`);
}
{
  const ids = new Set<string>();
  for (const r of rates.items) {
    const w = `rates/${r.id}`;
    if (ids.has(r.id)) err(w, "duplicate id");
    ids.add(r.id);
    if (!isStr(r.unit)) err(w, "unit missing");
    if (!(r.value === null || isNum(r.value))) err(w, "value must be a number or null");
    if (r.value === null && !isBi(r.note)) err(w, "value:null needs a {pt, en} note");
    if (typeof r.verify !== "boolean") err(w, "verify must be a boolean");
    if (!isStr(r.reference)) err(w, "reference missing");
  }
  if (rates.state !== "SC") err("rates", `state is "${rates.state}"; everything is Santa Catarina`);
  if (rates.house_prices_public !== false) err("rates", "house_prices_public must be false");
  if (!(rates.market_multiplier_note?.range?.[0] === 1 && rates.market_multiplier_note.range[1] === 3)) err("rates", "market_multiplier_note.range must be [1, 3]");
}
{
  if (options.prices_public !== false) err("options", "prices_public must be false");
  const ids = new Set<string>();
  for (const o of options.items) {
    const w = `options/${o.id}`;
    if (ids.has(o.id)) err(w, "duplicate id");
    ids.add(o.id);
    if (!(isNum(o.retention) && o.retention >= 0 && o.retention <= 1)) err(w, "retention must be 0..1");
    if (!isNum(o.added_m2)) err(w, "added_m2 must be a number");
    if (!(o.scene_step === null || isStr(o.scene_step))) err(w, "scene_step must be a string or null");
    for (const mid of o.models) {
      if (!(MODEL_IDS as readonly string[]).includes(mid)) { err(w, `unknown model "${mid}"`); continue; }
      if (o.scene_step && !models[mid].scene.steps.some((s) => s.id === o.scene_step))
        warn(w, `lists ${mid}, but ${mid} has no "${o.scene_step}" scene step: toggling it reveals nothing`);
    }
  }
}
{
  const max = models.k144max;
  if (maxExits.working_days !== max.working_days) err("max-exits", `working_days ${maxExits.working_days} != k144max ${max.working_days}`);
  for (const e of maxExits.exits) if (e.units * e.m2_per_unit !== max.area_m2) err(`max-exits/${e.id}`, `${e.units} x ${e.m2_per_unit} != ${max.area_m2} m²`);
}
{
  for (const t of timelapses.items ?? []) {
    const w = `timelapses/${t.id}`;
    if (!(MODEL_IDS as readonly string[]).includes(t.model)) err(w, `unknown model "${t.model}"`);
    if (!isBi(t.title)) err(w, "title must be {pt, en}");
    for (const k of ["youtube_id", "completed_on", "location"] as const) if (!isStr(t[k])) err(w, `${k} missing`);
    if (!isNum(t.working_days_actual)) err(w, "working_days_actual must be a number");
  }
}
{
  for (const id of MODEL_IDS) if (!cta.tertiary_by_model?.[id]) err("cta", `no tertiary_by_model for ${id}`);
  if (!cta.primary.href_template.includes("{prefill}")) err("cta", "primary.href_template needs {prefill}");
  if (!cta.primary.href_template.includes(cta.whatsapp_number_e164)) err("cta", "href_template does not use whatsapp_number_e164");
  if (!/^\d{10,15}$/.test(cta.whatsapp_number_e164)) err("cta", "whatsapp_number_e164 must be digits only");
}
{
  for (const k of ["bg", "panel", "accent", "text", "text_strong", "muted", "border", "grid"]) if (!isStr(brand.theme?.[k])) err("brand", `theme.${k} missing`);
  for (const t of TRACK_IDS) if (!isStr(brand.track_colors?.[t])) err("brand", `track_colors.${t} missing`);
  for (const k of ["name", "byline", "org", "primary_host", "future_host"] as const) if (!isStr(brand[k])) err("brand", `${k} missing`);
  if (!isBi(brand.tagline_note)) err("brand", "tagline_note must be {pt, en}");
  else for (const l of ["pt", "en"] as const) if (!brand.tagline_note[l].includes(String(models.k144max.working_days))) err("brand", `tagline_note.${l} must state the Max's ${models.k144max.working_days} working days`);
}
{
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
  const check = (where: string, year: string, dates: string[]) => {
    for (const d of dates) {
      const m = iso.exec(d);
      if (!m || m[1] !== year || Number.isNaN(Date.parse(d))) err(where, `bad date "${d}" for year ${year}`);
    }
  };
  for (const [y, ds] of Object.entries(holidays.national)) check(`holidays/national/${y}`, y, ds);
  for (const [city, years] of Object.entries(holidays.municipal)) for (const [y, ds] of Object.entries(years)) check(`holidays/${city}/${y}`, y, ds);
  if (!holidays.municipal.joinville) err("holidays", "municipal.joinville missing");
}

// ---- bot FAQ sources (hand-maintained) ----
{
  const ids = new Map<string, string>();
  for (const f of faqFiles) {
    const faq = load<FaqFile>(`bot/faq/${f}`);
    walkBi(faq, `bot/faq/${f}`);
    if (!isStr(faq.scope) || !Array.isArray(faq.items)) { err(`bot/faq/${f}`, "needs scope and items[]"); continue; }
    for (const it of faq.items) {
      if (ids.has(it.id)) err(`bot/faq/${f}`, `id "${it.id}" also in ${ids.get(it.id)}`);
      ids.set(it.id, f);
    }
  }
}

// ---- placeholders the components fill from the model ----
if (!(cta.secondary.label.pt.includes("{days}") && cta.secondary.label.en.includes("{days}"))) err("cta", "secondary.label must use {days} (the Max has 45 working days)");
for (const l of ["pt", "en"] as const) if (!ui[l].abstract_days?.includes("{n}")) err("ui.json", `${l}.abstract_days must use {n}`);

// ---- guard rails from SPEC §18 and §1 ----
{
  const files = [
    ...MODEL_IDS.map((i) => `data/models/${i}.json`),
    ...readdirSync(root + "data/shared").map((f) => `data/shared/${f}`),
    "data/i18n/ui.json",
    ...faqFiles.map((f) => `bot/faq/${f}`),
  ];
  const forbidden: [RegExp, string][] = [
    [/minas gerais/i, "nothing is quoted from Minas Gerais"],
    [/policarbonato|polycarbonate/i, "polycarbonate is not shown"],
    [/sprint/i, "no sprint view anywhere"],
  ];
  const hidden = partners.partners.filter((p) => !p.confirmed && p.name).map((p) => ({ id: p.id, name: p.name!.split(" (")[0] }));
  for (const f of files) {
    const text = readFileSync(root + f, "utf8");
    for (const [re, why] of forbidden) if (re.test(text)) err(f, `contains "${re.source}": ${why}`);
    // Shared blocks render on the 45-day Max page too, so they carry no fixed "30 days". brand.json is exempt: its tagline names the Max.
    if ((f.startsWith("data/shared/") && f !== "data/shared/brand.json") || f === "data/i18n/ui.json")
      if (/\b30[ -](dias|day|working)/i.test(text)) err(f, 'contains a fixed "30 days" claim; use the model\'s working_days');
    if (f.startsWith("data/") && f !== "data/shared/partners.json")
      for (const h of hidden) if (text.includes(h.name)) warn(f, `names "${h.name}" (${h.id}) while unconfirmed; the name will render`);
  }
}

// ---- one-screen summary per model (SPEC §15) ----
for (const id of MODEL_IDS) {
  const m = models[id];
  console.log(`${id.padEnd(8)} ${String(m.working_days).padStart(2)} working days | ${m.activities.length} activities | peak crew ${m.crew_peak_observed}/${m.crew_peak} planned | milestones ${Object.entries(m.milestones).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  for (let d = 1; d <= 5; d++) {
    const on = m.activities.filter((a) => a.start <= d && d <= a.end).map((a) => a.id + (a.offsite ? "*" : ""));
    console.log(`           day ${d}: ${on.join(", ")}`);
  }
}
console.log("           (* = off-site)");
console.log(`\nui keys ${Object.keys(ui.pt).length} pt / ${Object.keys(ui.en).length} en | partners ${partners.partners.length} (${partners.partners.filter((p) => p.confirmed).length} confirmed) | options ${options.items.length} | rates ${rates.items.length} | bot FAQ ${faqFiles.length} files | time-lapses ${timelapses.items.length}${timelapses.items.length ? "" : " (gallery hidden)"}`);
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  - ${warnings.join("\n  - ")}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log("\nvalidate: OK");
