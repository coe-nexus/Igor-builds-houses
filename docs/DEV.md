# Developing and deploying

## Commands
- `npm run dev`: dev server.
- `npm run validate`: schema and schedule checks over `data/` and `bot/faq/` (SPEC §3, §15). Must exit 0 before any commit that touches `data/`. Warnings do not fail.
- `npm run typecheck`, `npm run build`, `npm run preview`.

## Routing
Hash routing: `/#/96`, `/#/144-max`, `/#/due-diligence`. Query params live inside the hash (`/#/96?lang=en&day=12`); `?lang=en#/96` also works. No 404.html trick is needed on GitHub Pages or inside the kiver.org iframe.

## Base path
`VITE_BASE=/build/` for kiver.org (the workflow default), `VITE_BASE=/` for igorbuildshouses.com. To preview on the repo's own GitHub Pages URL, set the repo variable `VITE_BASE=/Igor-builds-houses/`.

## Moving to igorbuildshouses.com
1. Set the repo variable `VITE_BASE=/`.
2. Rename `public/CNAME.example` to `public/CNAME` (the file holds the domain only).
3. DNS at the registrar: apex A records 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; `www` CNAME to `<github-user-or-org>.github.io`.
4. Settings > Pages: enable HTTPS.
5. The display name is one value: `name` in `data/shared/brand.json`.

## Partners and logos
- Names, cities, URLs and logos of partners with `confirmed: false` are stripped at build time (`redactUnconfirmedPartners` in `vite.config.ts`), so they are not in the published bundle. The page shows the role and a monogram.
- This repository is public, so `data/shared/partners.json` still lists the names in git. Flip `confirmed` only with the partner's written confirmation.
- Logos go in `public/partners/{id}.svg` (or `.png`) and are set in `partners.json` as `"logo": "partners/{id}.svg"`. The validator rejects a logo on an unconfirmed partner.

## The financial model
`Kiver_Build_Model.xlsx` is never committed (`.gitignore` blocks `*.xlsx`) and is not on the site. It is shared as a Google Sheet restricted to named people. The site only offers a "request access" entry point (WhatsApp prefill), added in P4.

## Phase status
P0 scaffold done. Next: P1 calendar and schedule lib (SPEC §17).
