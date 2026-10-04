# Deploying to Cloudflare Pages

The site is static: `npm run build` writes `dist/`, nothing runs on a server, and there are no secrets.

## Connect the repository (recommended)
1. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git. Choose `coe-nexus/Igor-builds-houses`.
2. Production branch: `main`. Every other branch and pull request gets its own preview URL.
3. Build settings:
   - Framework preset: None
   - Build command: `npm run validate && npm run build`
   - Build output directory: `dist`
   - Environment variable `NODE_VERSION` = `22` (the `.node-version` file says the same)
4. Save and deploy. The site is live at `https://<project>.pages.dev`.

Optional environment variables:
- `VITE_BASE`: asset base path. Default `/`, which is right for a Pages domain, a custom domain and a subdomain. Use `/build/` only if the site is served under `kiver.org/build/` through a reverse proxy.
- `VITE_SITE_URL`: absolute site URL used in Open Graph image links. Defaults to Cloudflare's `CF_PAGES_URL`, so link previews work without setting it; set it once a custom domain is live.

## Direct upload (no Git integration)
```
npm ci
npm run validate && npm run build
npx wrangler pages deploy dist --project-name kiver-build
```
`wrangler` is not a dependency of the repo; `npx` fetches it.

## Custom domain
Pages project > Custom domains > Set up a domain. Use a subdomain of kiver.org (for example `build.kiver.org`) for the first phase, and `igorbuildshouses.com` after the move. Nothing in the code changes. The display name is one value, `name` in `data/shared/brand.json`.

## Headers
`public/_headers` is read by Cloudflare Pages. It sets a Content-Security-Policy, caching for hashed assets, and `frame-ancestors`, the list of sites allowed to embed the pages in an iframe. Add a domain there before embedding from it (see docs/EMBED.md).

## Link previews
The build writes one HTML shell per model (`/64/`, `/96/`, `/96-pro/`, `/144-pro/`, `/144-max/`) with that model's title, description and Open Graph image (`public/og/`). Share those URLs, not the hash URLs, so previews are correct. Each shell opens the app on its hash route. Regenerate the images with `scripts/gen-og.mjs` (needs `playwright-core` and a Chromium; not a dependency).

## After the first deploy
- `https://<site>/#/96` renders in PT and, with `?lang=en`, in EN.
- `https://<site>/96/` opens the same page and previews with the Kiver 96 card.
- The iframe snippet in docs/EMBED.md renders on a test page and resizes.
- In a browser console on the site: no Content-Security-Policy violations.
