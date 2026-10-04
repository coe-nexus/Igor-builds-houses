# SPEC: Kiver Build, the 30-working-day pages

Version 1.1, 4 October 2026. Owner: Izzy Kiver. Executor: Claude Code. All owner decisions are in; nothing in §19 blocks the build.

## 0. What you are building

Five pages, one per model, each answering one question for a buyer, an investor or a crew member: how does this house get built in 30 working days (45 for the Max), and what has to be true before Day 1. The pages share a skeleton and a data layer. They are static, bilingual, embeddable by iframe on kiver.org, and later served from their own domain with no code change.

This folder already contains:

```
CLAUDE.md                     standing rules
SPEC.md                       this file
data/
  models/k64.json             the five 30-day schedules (generated)
  models/k96.json
  models/k96pro.json
  models/k144pro.json
  models/k144max.json
  shared/due-diligence.json   pre-build block, identical on all pages
  shared/partners.json        partners strip, identical on all pages
  shared/rates.json           per m² electrical/hydraulic/sanitary table, identical on all pages
  shared/options.json         options and resale retention (no prices)
  shared/max-exits.json       the Max's three exits (no prices)
  shared/timelapses.json      gallery of completed builds (empty at launch; section hidden while empty)
  shared/cta.json             calls to action per page, WhatsApp prefill codes
  shared/brand.json           name, theme tokens, fonts, disclaimer, future host
  shared/holidays.json        BR national + Joinville dates for the working-day calendar
  i18n/ui.json                UI chrome strings, pt and en
bot/                          WhatsApp assistant, PT/EN/RU: flow.json, system-prompt.md, faq/*.json (separate service, see docs/SALES.md §5 and §9)
docs/SALES.md                 CTAs, bot architecture, the 15-minute session
docs/CAMERAS.md               live stream (private), time-lapse, AI frames
scripts/gen_schedules.py      regenerates data/models/*.json; edit this, not the JSON
scripts/gen_sales.py          regenerates cta.json and bot/faq/*.json
reference/carcaca-12x8.jsx    look, feel and interaction model (React + three)
reference/house_steel_frame_asbuilt.html   layer toggle pattern
```

You create everything else.

## 1. Decisions already made

| Topic | Decision |
|---|---|
| Stack | Vite + React 18 + TypeScript + three, static build |
| Language | Bilingual, PT default, EN toggle, persisted in `localStorage` and `?lang=` |
| Visual depth | 3D step scene synced to a Gantt scrubber, like the carcaça file |
| Calendar | Abstract Day 1 to 30 by default; optional start-date picker that skips weekends and `holidays.json` |
| Durations | 64, 96, 96 Pro and 144 Pro: 30 working days. Max: 45 working days with a crew of 16. Each model carries its own `working_days`; there is no sprint view |
| 64 | 30 days include factory panel time running in parallel with the radier cure; assembly on Day 12. The 64 page shows two scenes synced to one scrubber: the factory panel line and the site |
| Canonical wall, 96 | Copaíba plywood + wrap + ventilated siding. Polycarbonate (from the carcaça) is not shown |
| Cameras | No live feed on the website. The live stream (YouTube unlisted) goes to the private investors' WhatsApp group. Pages carry a time-lapse gallery of completed builds from `timelapses.json`, hidden while empty. See docs/CAMERAS.md |
| Prices | Per m² rates public (`rates.json`). House and option prices are not on the page; "Request a quote" button instead |
| Brand | "Kiver Build" from `brand.json` while on kiver.org; future host `igorbuildshouses.com` is in `brand.json` and `public/CNAME.example`. Switching the display name later is one config value |
| Partners | Role always shown; name and logo only when `confirmed: true`. Logos arrive later: while `logo` is null render a monogram placeholder from the name's initials (or the role's, when the name is hidden) |
| Rates reference | SINAPI-SC (Santa Catarina table) as the public reference, with the note that the market charges 1x to 3x it depending on quality; Kiver figures are the SC standard. Nothing quoted from Minas Gerais |

§19 records the owner's answers. Everything is a config value, not a code change.

## 2. Repository layout to create

```
index.html
vite.config.ts                 base from VITE_BASE (default "/"), used for GitHub Pages subpath
package.json
tsconfig.json
public/
  CNAME.example                for the future domain
  og/                          generated OG images per model (Phase 7)
src/
  main.tsx
  App.tsx                      router
  routes/
    Home.tsx                   model picker
    ModelPage.tsx              the page skeleton, parameterised by model id
    DueDiligencePage.tsx       standalone view of the shared block (also embedded on each model page)
  components/
    Hero/
    DueDiligence/
    Gantt/
    DayScrubber/
    DayPanel/
    SceneViewer/
    CrewHistogram/
    Milestones/
    OptionsResale/
    MaxExits/
    PartnersStrip/
    RatesTable/
    TimelapseGallery/
    LangToggle/
    CalendarPicker/
    RequestQuote/
    EmbedFrame/
  scene/
    materials.ts               ported from carcaça
    primitives.ts              box(), iBeam(), metalon(), panel()
    steelChassis.ts            parametric builder for k96, k96pro, k144pro, k144max
    woodFrame.ts               parametric builder for k64 (site)
    woodFrameFactory.ts        factory panel line for k64 (second scene)
    camera.ts                  orbit, pinch, auto-rotate (ported)
  lib/
    data.ts                    typed loaders for data/*.json
    workdays.ts                working-day calendar
    schedule.ts                derived views: activities by day, crew by day, hold points
    i18n.ts                    t(key), pick({pt,en})
    dayStore.ts                selected day, calendar mode, lang, trade toggles
  styles/
    theme.css                  CSS variables from brand.json
    base.css
scripts/
  gen_schedules.py             (exists)
  validate.ts                  npm run validate
  export-csv.ts                schedule CSV per model
.github/workflows/pages.yml
```

## 3. Data contracts

Write TypeScript types in `src/lib/types.ts` that match these exactly. `npm run validate` checks every JSON against them (use zod or hand-written guards; zod is allowed as a dev dependency only if you also use it at runtime for the loaders).

### 3.1 Model (`data/models/*.json`)

```ts
type Bi = { pt: string; en: string };
type Model = {
  id: "k64" | "k96" | "k96pro" | "k144pro" | "k144max";
  name: Bi;
  footprint: { w: number; l: number; floors: number; ceiling_m: number; bay_m: number };
  area_m2: number;
  system: "steel" | "wood";
  system_label: Bi;
  working_days: 30 | 45;        // 45 only for k144max
  crew_peak: number;            // planned site crew at peak
  shop_crew: number;            // off-site crew (prefab)
  milestones: Record<string, number>;   // day numbers; keys vary by system
  risk_note: Bi;
  land_note: Bi;
  tracks: { id: TrackId; pt: string; en: string }[];
  scene: { builder: "steelChassis" | "woodFrame"; steps: { id: string; pt: string; en: string }[] };
  scene_factory?: { builder: "woodFrameFactory"; steps: { id: string; pt: string; en: string }[] };  // k64 only
  activities: Activity[];
  crew_by_day: number[];        // length working_days, site crew only, generated
  crew_peak_observed: number;   // generated
  days_over_peak: number[];     // generated; must be empty
};
type TrackId = "prefab" | "foundation" | "structure" | "envelope" | "mep" | "finishes" | "options" | "inspection";
type Activity = {
  id: string; track: TrackId;
  start: number; end: number;   // working days, 1..working_days, inclusive
  crew: number;                 // people on this activity while active (0 for cure, buffers, subcontracted)
  pt: string; en: string;
  scene_step?: string;          // id in scene.steps or scene_factory.steps; the group appears when day >= start
  hold_point?: { pt: string; en: string; by: "engineer" | "utility" | "owner" };
  offsite?: true;               // prefab track; excluded from crew_by_day
  optional?: true;              // options track
  subcontracted?: true;
  risk?: string;
};
```

Rules the validator enforces:
- `1 <= start <= end <= working_days`
- every `scene_step` exists in `scene.steps` or `scene_factory.steps`, and every step in both lists is referenced by at least one activity
- `crew_by_day[d-1] == sum(crew of non-offsite activities active on d)`
- `max(crew_by_day) <= crew_peak` and `days_over_peak` is empty
- milestone days fall on an activity's `end` with a `hold_point`
- `handover` is day `working_days`
- all `pt` and `en` present and non-empty

### 3.2 Shared files

`due-diligence.json`: `steps[]` with `id, weeks:[min,max], partner_ids[], gate, title:Bi, pt, en`; `typical_total_weeks`, `critical_path:Bi`.
`partners.json`: `partners[]` with `id, name|null, category, role:Bi, city|null, url|null, logo|null, confirmed`.
`rates.json`: `items[]` with `id, label:Bi, unit, value|null, verify, reference, note?:Bi`; `basis:Bi`; `market_multiplier_note{range,pt,en}`; `state:"SC"`; `public`; `house_prices_public:false`; `request_label:Bi`.
`options.json`: `items[]` with `id, label:Bi, added_m2, retention (0..1), scene_step|null, models[], why:Bi`; `prices_public:false`.
`max-exits.json`: `exits[]`, `legal:Bi`, `working_days`.
`timelapses.json`: `items[]` per `item_schema` (id, model, title:Bi, youtube_id, completed_on, working_days_actual, location); empty at launch.
`cta.json`: see docs/SALES.md §2; the page reads `primary`, `secondary`, `tertiary_by_model[model]`, `sticky_mobile`.
`brand.json`: `name, alt_names, byline, org, tagline:Bi, theme{}, track_colors{}, fonts{}, disclaimer:Bi`.
`holidays.json`: `national{year: date[]}`, `municipal.joinville{year: date[]}`.
`ui.json`: `{pt: Record<string,string>, en: Record<string,string>}` with identical key sets (validator checks).

## 4. Working-day calendar (`src/lib/workdays.ts`)

- Abstract mode (default): the x-axis is Day 1 to `working_days` (30, or 45 for the Max), no dates.
- Calendar mode: the user picks a start date (must be a working day; if not, snap forward and say so). Day n maps to the nth working day on or after the start, skipping Saturday, Sunday and every date in `holidays.json` (national plus `municipal.joinville`). Show the Day 1 date and the final day's date as "Planned handover". Weekends and holidays render as thin grey gaps in the Gantt so the visitor sees why 30 working days is about seven calendar weeks.
- Persist mode and start date in the URL (`?start=2026-11-03`) so a link can be shared.
- Years outside `holidays.json` fall back to weekends only and show a one-line warning.

## 5. Routes

```
/                    Home: five cards (name, m², floors, system, weathertight day, handover day), language toggle
/64 /96 /96-pro /144-pro /144-max     ModelPage
/due-diligence       the shared block as its own page
?lang=pt|en   ?day=12   ?start=YYYY-MM-DD   ?embed=1
```

Use hash routing (`/#/96`) unless you add a 404.html redirect trick for GitHub Pages; either is fine, document which.

## 6. ModelPage anatomy, top to bottom

1. **Hero**: model name, tagline from `system_label`, four facts (area, floors, ceiling 3 m, crew peak), the working-day count from the model, two milestone chips (weathertight day, handover day), the `risk_note`. Primary CTA from `cta.json` (WhatsApp with prefill code), secondary download. The 64 page adds the tertiary MCMV line under the hero.
2. **Due diligence** (shared component): a horizontal pipeline of the 11 steps with week ranges, partner roles (names only if confirmed), the critical path sentence, and a closing line "Day 1 starts when the last step is green". Collapsed to a summary bar on mobile with "expand".
3. **The build**: the core. Two panes on desktop (scene left 60%, Gantt right 40%), stacked on mobile (scene on top, 16:10, sticky scrubber under it, Gantt below). One scrubber drives both. On the 64 page the scene pane holds two canvases, Factory and Site, side by side on desktop and as tabs on mobile, both driven by the same day; the factory canvas pauses rendering when its tab is hidden.
4. **Day panel**: under the scrubber. "Day 12 of 30: On site this day" then the list of active activities with track colour chip, crew, off-site or subcontracted badges, and any hold point as a highlighted card with who signs it.
5. **Crew histogram**: 30 bars of `crew_by_day`, planned peak as a line, with the shop crew shown as a lighter stacked segment for prefab days. Clicking a bar sets the day.
6. **Milestones**: the model's `milestones` as a row of markers; clicking one sets the day.
7. **Options and resale** (shared data filtered by `models[]`): each option as a card with retention shown as a ring or bar, `added_m2` where present, `why`. Toggling an option on also reveals its scene group (terrace, carport, solar, pool) in the 3D view from its activity's start day.
8. **Max only: One house, three exits** from `max-exits.json`. The Max's Gantt simply has 45 columns; nothing else is special.
9. **Time-lapse gallery**: entries from `timelapses.json` filtered by model (fall back to all models with a caption when the model has none); YouTube embeds, lazy, with title, location, completed date and actual working days. The whole section is hidden while the filtered list is empty. No live stream anywhere on the site.
10. **Partners strip** (shared).
11. **Rates table** (shared): the per m² items with a `reference` column (SINAPI-SC); `value: null` renders the `note`; every `verify: true` row carries a small "to be confirmed" tag; the basis sentence under the table, including the 1x to 3x market range from `market_multiplier_note`. Everything is SC; never label anything Minas Gerais.
12. **Footer**: brand, byline, the planning disclaimer, and, once counsel approves it, the investor disclaimer from `brand.json` (`investor_disclaimer_counsel_to_approve`; render it only when a `counsel_approved: true` flag is added next to it), language toggle, link to Home.

In `?embed=1` mode: hide Home navigation and footer chrome, keep the disclaimer, post height to the parent with `postMessage({type:"kiver-build:height", height})` on resize.

## 7. Gantt

- Rows = tracks in `tracks` order; activities render as bars from `start` to `end` on a `working_days`-column grid (or dated columns in calendar mode).
- Colour = `brand.track_colors[track]`; optional activities are hatched; off-site bars are outlined, not filled; subcontracted bars are dashed.
- Hold points render as a diamond at the bar's end; hovering or tapping opens the hold-point card.
- A vertical cursor shows the selected day; bars left of it are full opacity, right of it are 40%.
- Click a bar to set the day to its start and open its detail in the day panel.
- Trade toggles above the chart (checkbox per track, ported from the as-built HTML's layer panel) hide rows and the matching scene groups.
- Screen-reader fallback: a `<table>` version toggled by a button, same data.

## 8. Scene (three.js)

Port the carcaça file's materials, `box`, `iBeam`, lighting, ground grid, orbit and pinch handling. Then write two parametric builders.

### 8.1 `steelChassis(params)`
Inputs: `w, l, floors, ceiling_m, bay_m, options[]`. Produces named groups:

```
site, found_points, gravel, ring, joists_f1, deck_f1, columns_f1,
ring_f2, deck_f2, columns_f2, ... (per floor, columns only below the top floor),
top_ring, purlins, walls_f1 .. walls_fN, roof_panels, wrap, windows, siding, partitions,
stair (floors > 1), interior_lining, floor_finish, terrace, carport, solar, pool
```

Geometry rules:
- Column grid at `bay_m` in both directions, columns at every grid intersection on the perimeter and interior lines (12 on 8x12, 16 on 12x12).
- Baldrame ring: W-profile I-beams on the perimeter plus interior lines along the length where `w / bay_m > 1`.
- Floor-to-floor = `ceiling_m + 0.25` (beam depth); roof is a low duas-águas on purlins with a small overhang.
- `walls_fN` = tilt-up panels: thin boxes per facade segment between columns, with window cut-outs implied by a lighter rectangle; `siding` is a thin skin 0.04 m outside the panels; `windows` are translucent planes.
- `partitions` are a simple interior layout per footprint (a spine along the length and two or three cross walls); exact plan is not the point, legibility is.
- `terrace` = 17 m² deck plus roof extension on one short side; `carport` = two-bay pergola beside the house; `solar` = panel array on one roof slope; `pool` = 6x3 box sunk beside the terrace.
- Max: four floors, two tilt-up days per floor (the panel group for a floor fades in over its two days), `conv` provisions not modelled; stair and a shaft volume are enough.

### 8.2 `woodFrame(params)`
Groups: `site, radier_forms, radier, panels, roof_tiles, cladding, partitions, interior_lining, floor_finish`. Panels appear all at once on assembly day (that is the point of the 64).

### 8.2b `woodFrameFactory(params)` (64 only, second canvas)
Groups: `fac_floor` (a shop floor with two framing tables and a saw station), `fac_panels` (finished wall panels leaning in a rack; the number visible grows with progress through the `panels_fab` activity, from 0 on day 1 to the full set, roughly perimeter / 2.4 m, on day 7), `fac_trusses` (a stack that grows across days 5 to 8), `fac_truck` (a flatbed at the door that fills on days 9 and 10 and leaves on day 11: the group hides again from day 12, when the same panels appear on site). Same materials and lighting as the site scene; a smaller orbit radius.

### 8.3 Visibility
A step group is visible when `day >= start` of the first activity that references it; opacity ramps from 0.35 at `start` to 1 at `end` (single-day activities just pop in). Options appear only if toggled on. Trade toggles hide groups by track of the referencing activity.

### 8.4 Performance
- One renderer per page, devicePixelRatio capped at 2, `BoxGeometry` instances reused, no shadows.
- Pause the render loop when the canvas is off-screen (`IntersectionObserver`).
- The Max has roughly 1,200 boxes and the 64 page runs two canvases; if frame time on a mid-range Android exceeds 20 ms, merge static geometry per group with `BufferGeometryUtils.mergeGeometries`, and never render a hidden canvas.
- Respect `prefers-reduced-motion`: no auto-rotate.

## 9. Day state

`dayStore`: `{ day: 0..working_days, lang, calendarMode, startDate, enabledTracks, enabledOptions, setDay(), ... }`. Day 0 means "before Day 1" and shows the due-diligence state (empty site with the fence and cameras). `?day=` in the URL is read on load and written on change (replaceState). Keyboard: left/right arrows move a day, Home/End jump, space toggles autoplay (1 day per 800 ms, stops at the last day).

## 10. Due diligence block

Render `steps[]` as a pipeline. Each step shows title, week range, partner roles (from `partner_ids`, names only if `confirmed`, monogram placeholder where the logo is null), and a "Gates Day 1" tag when `gate` is true. Steps that typically run in parallel (design, permit, utilities, procurement) are drawn on a second lane so the 6 to 10 week total reads correctly. The cameras step gets a small camera icon and the LGPD sentence. The block is the same component on every page and on `/due-diligence`.

## 11. Partners strip and rates table

Partners: a single row of cards, role first, name second (or "to be confirmed"), logo if present else a monogram placeholder, link if `url`. Group by category in the order: engineering, fabrication, materials, lab, utility, public, finance. Logos will be dropped into `public/partners/{id}.svg|png` later; the loader checks for the file before falling back to the monogram.

Rates: a plain table, PT and EN labels from data, unit column, value column formatted `R$ 90/m²`, a reference column (SINAPI-SC), null values show the note. Basis sentence under the table, then the market range line from `market_multiplier_note` (1x to 3x depending on quality). Everything is Santa Catarina; never label anything Minas Gerais. No totals, no house prices.

## 12. i18n

- `pick(bi)` returns the string for the current language; `t(key)` reads `ui.json`.
- Language toggle in the header and footer; default PT; `?lang=en` overrides; choice persisted.
- Numbers: PT uses `1.234,5`, EN uses `1,234.5`; `m²` and `R$` are the same in both.
- The validator fails if `ui.pt` and `ui.en` key sets differ or if any model/shared `Bi` is missing a language.

## 13. Embedding on kiver.org

Ship `docs/EMBED.md` with this snippet and the height-message listener:

```html
<iframe src="https://kiver.org/build/#/96?embed=1&lang=pt" title="Kiver 96: 30 working days"
        style="width:100%;border:0;min-height:900px" loading="lazy" allow="fullscreen"></iframe>
<script>
window.addEventListener("message", e => {
  if (e.data && e.data.type === "kiver-build:height") {
    document.querySelector("iframe[title^='Kiver']").style.height = e.data.height + "px";
  }
});
</script>
```

`VITE_BASE=/build/` for the kiver.org subpath; `VITE_BASE=/` for `igorbuildshouses.com`. Nothing else changes.

## 14. Deploy

- `.github/workflows/pages.yml`: on push to `main`, `npm ci`, `npm run validate`, `npm run typecheck`, `npm run build` with `VITE_BASE` from a repo variable (default `/build/`), deploy `dist/` to GitHub Pages.
- `public/CNAME.example` contains `igorbuildshouses.com` with the DNS steps as comments; rename to `CNAME` on the day of the move, not before.
- Output must be fully static: no server functions, no env secrets.

## 15. Validation (`npm run validate`)

A TypeScript script run with `tsx` (dev dependency) that loads every JSON and enforces §3, plus: `cta.json` has a tertiary for every model id; `timelapses.json` items reference valid model ids; `bot/faq/*.json` ids are unique. It prints a one-screen summary per model: working days, activities, peak crew observed vs planned, milestones, and the first five days' activity list. Non-zero exit on any violation. Also regenerates nothing; generation stays in Python so Daniel can edit schedules without Node.

## 16. Design direction

The carcaça file is the mood: `#14171b` background, `#ff8a3d` accent, monospace small caps labels, warm off-white text. Keep it. Add one body font (Inter, self-hosted, two weights) for paragraphs. Hero and section titles in the monospace label style, 11 px letter-spaced eyebrow above a 20 to 28 px title. Cards have 1 px `#2a3038` borders, no shadows. Track colours from `brand.json`. Hold points are the only place a second accent appears (use the inspection green). The whole page should feel like an instrument panel, not a brochure.

Mobile: the scene is 16:10 at the top of "The build", the scrubber is sticky under it with a 44 px thumb, the Gantt scrolls horizontally inside its own container, day panel below. Nothing wider than the viewport.

## 17. Phases and acceptance

Work in this order. Each phase is one PR. Do not start the next until the acceptance lines pass.

**P0 Scaffold.** Vite + React + TS, routing, theme from `brand.json`, `data.ts` loaders with types, `validate.ts` passing on the shipped data, Pages workflow building a placeholder.
Accept: `npm run validate` and `npm run build` green in CI; `/#/96` renders the model name in PT and EN.

**P1 Calendar and schedule lib.** `workdays.ts`, `schedule.ts` (activitiesOn(day), crewOn(day), holdPointsOn(day), stepStartDay(stepId)), unit tests with vitest for the calendar (a start on a Friday before Carnival, a start on a holiday, year rollover).
Accept: tests green; a Day 30 from 2026-11-03 resolves to the correct date given `holidays.json` (compute it in the test, do not hardcode).

**P2 Gantt + scrubber + day panel + crew histogram + milestones.** All driven by `dayStore`, URL sync, keyboard, screen-reader table.
Accept: on `/#/96?day=13` the day panel shows the tilt-up day with crew 8 and the Gantt cursor sits on day 13; on `/#/64?day=12` it shows ASSEMBLY DAY with its hold point; on `/#/144-max` the grid has 45 columns and `?day=45` is the handover; trade toggles hide rows.

**P3 Scene builders.** Port carcaça primitives; `steelChassis`, `woodFrame` and `woodFrameFactory`; visibility rules; performance guards.
Accept: `/#/96` at day 8 shows only footings, gravel and the W ring; at day 13 the panels are up; at day 30 everything. `/#/144-max` at day 26 shows four floors of panels and at day 27 the stair. `/#/64` at day 7 shows a full panel rack in the factory canvas and only a slab on the site canvas; at day 12 the rack is empty and the house stands. 60 fps on a laptop, no dropped input on a mid-range Android for the 96.

**P4 Shared blocks and CTAs.** Due diligence, partners strip (monogram placeholders), rates table with reference column and market range, options and resale (with scene group toggles), Max exits, time-lapse gallery (hidden while empty), CTAs from `cta.json` with WhatsApp prefill codes, secondary download gate, sticky mobile bar.
Accept: all five pages show byte-identical due diligence, partners and rates markup; unconfirmed partners show role only; options toggle the terrace in the scene on `/#/96`; tapping the hero CTA on `/#/96` opens WhatsApp with `[K96-H]` in the text; the gallery section is absent from the DOM while `timelapses.json` is empty.

**P5 i18n and polish.** Full PT/EN pass, number formatting, `prefers-reduced-motion`, focus states, OG tags per model.
Accept: no bare strings (grep the JSX for `>[A-Za-z]`), Lighthouse mobile: performance ≥ 85, accessibility ≥ 95 on `/#/96`.

**P6 Embed and deploy.** `?embed=1`, height messaging, `docs/EMBED.md`, Pages live under `/build/`, CSV export per model.
Accept: the iframe snippet renders on a test page with auto height; `VITE_BASE=/` build also works from root.

**P7 Post-launch content loop.** The pages go public after P6; the owner has cleared the schedules. When the engineer of record or Daniel sends corrections, change `gen_schedules.py`, regenerate, validate, record in `CHANGELOG.md`. Same loop for logos (`public/partners/`), the first time-lapse entry, and flipping partner `confirmed` flags.

## 18. Things not to do

- Do not put polycarbonate walls, prices, investor returns, the spreadsheet model's margins or any live camera feed on any page.
- Do not render a partner's name or logo while `confirmed` is false.
- Do not hand-edit `data/models/*.json`.
- Do not add a CMS, a database or a login. The data folder is the CMS.
- Do not describe the 30 days as a guarantee anywhere; the disclaimer stays on every page and in the embed.

## 19. Owner decisions (4 October 2026)

1. "MG" is MG Projetos (Eng. Civil Cristion), the partner who draws the project plans; in `partners.json` and the design step. SINAPI-SC is the public reference; the table says the market charges 1x to 3x it depending on quality. Everything is quoted for Santa Catarina.
2. Partner confirmations and logos arrive separately; monogram placeholders until then.
3. The Max is 45 working days, crew of 16. No 30-day sprint anywhere.
4. Live stream is YouTube unlisted, shared only in the private investors' WhatsApp group. The site carries completed-build time-lapses only. Recommendations in docs/CAMERAS.md.
5. Future domain: igorbuildshouses.com. Display name stays Kiver Build until the move; one config value flips it.
6. The 64 page shows the factory as a second scene.
7. Schedules are cleared to go public. `scripts/gen_schedules.py` stays the single place for later edits.

## 20. Amendments made while building (4 October 2026)

1. **Deploy target is Cloudflare Pages**, not GitHub Pages (§14). `.github/workflows/ci.yml` only gates changes; `docs/DEPLOY.md` has the setup. `VITE_BASE` defaults to `/`. `public/CNAME.example` is gone; custom domains are set in Cloudflare.
2. **FAQ on every page.** Entries come from `bot/faq/`; `data/shared/faq-site.json` selects them. The Home page has a short FAQ too.
3. **Every CTA goes to WhatsApp**, with a `[MODEL-PLACEMENT]` code. The §4 download gate has no server: name, email and optional phone travel in the WhatsApp message, then the CSV and a print-to-PDF view unlock. Extra codes: `Q` quote request, `M` model access (shown only with `counsel_approved`).
4. **Open Graph per model** is served by a generated shell page per model (`/96/`), because the app routes by hash (§5).
5. **The financial model is a restricted Google Sheet**, not a file on the site; it is never committed.
6. **Shared data additions**: `brand.tagline_note` and `brand.description`, `due-diligence.steps[].lane`, `faq-site.json`, ui keys. No field was renamed.
