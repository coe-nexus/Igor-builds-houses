# Developing

## Commands
- `npm run dev`: dev server.
- `npm run validate`: schema and schedule checks over `data/` and `bot/faq/` (SPEC §3, §15). Must exit 0 before any commit that touches `data/`. Warnings do not fail.
- `npm run typecheck`, `npm test` (vitest), `npm run build`, `npm run preview`.
- `npm run export-csv`: schedule CSVs per model and language into `exports/` (git-ignored).

## Data flow
`scripts/gen_schedules.py` writes `data/models/*.json` and `scripts/gen_sales.py` writes `data/shared/cta.json`. Change the Python, re-run, commit both. Everything else in `data/` and `bot/faq/` is edited by hand. `data/shared/faq-site.json` picks which bot FAQ entries the site shows.

## Routing
Hash routing: `/#/96`, `/#/144-max`, `/#/due-diligence`, `/#/print/96`. Query params live inside the hash (`/#/96?lang=en&day=12&start=2026-11-03&embed=1`); `?lang=en#/96` also works. No server rules are needed. The build also writes a shell page per model (`/96/`) for link previews.

## Partners and logos
- Names, cities, URLs and logos of partners with `confirmed: false` are stripped at build time (`redactUnconfirmedPartners` in `vite.config.ts`), so they are not in the published bundle. The page shows the role and a monogram.
- This repository is public, so `data/shared/partners.json` still lists the names in git. Flip `confirmed` only with the partner's written confirmation.
- Logos go in `public/partners/{id}.svg` (or `.png`) and are set in `partners.json` as `"logo": "partners/{id}.svg"`. The validator rejects a logo on an unconfirmed partner.

## Calls to action
Every CTA opens WhatsApp with a prefilled message and a code `[MODEL-PLACEMENT]`: H hero, B after the build, S sticky bar, F footer, T per-model tertiary, Q quote request, M financial-model access. `M` and the FAQ entries that mention investors (`counsel_only` in `faq-site.json`) appear only when `counsel_approved: true` is added to `data/shared/brand.json`, next to the investor disclaimer.

## The financial model
`Kiver_Build_Model.xlsx` is never committed (`.gitignore` blocks `*.xlsx`) and is not on the site. It is shared as a Google Sheet restricted to named people; the `M` entry point above is how a visitor asks for access.

## Deploying
See docs/DEPLOY.md (Cloudflare Pages) and docs/EMBED.md.
