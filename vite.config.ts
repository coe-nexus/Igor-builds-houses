/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const readJson = (rel: string) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8"));

/** Monogram favicon from the brand colours, inline so there is no extra request. */
function favicon(bg: string, accent: string, name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${bg}"/><text x="16" y="23" font-family="monospace" font-size="20" font-weight="700" text-anchor="middle" fill="${accent}">${name[0]}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Inject <title>, theme-color and the brand CSS variables so the page never flashes and nothing is hardcoded in CSS. */
function brandHtml(): Plugin {
  return {
    name: "kiver-brand-html",
    transformIndexHtml() {
      const brand = readJson("./data/shared/brand.json");
      const vars: string[] = [];
      for (const [k, v] of Object.entries(brand.theme)) vars.push(`--${k.replace(/_/g, "-")}:${v}`);
      for (const [k, v] of Object.entries(brand.track_colors)) vars.push(`--track-${k}:${v}`);
      vars.push(`--font-label:${brand.fonts.label}`, `--font-body:${brand.fonts.body}`);
      return [
        { tag: "title", children: brand.name, injectTo: "head" },
        { tag: "meta", attrs: { name: "theme-color", content: brand.theme.bg }, injectTo: "head" },
        { tag: "style", children: `:root{${vars.join(";")}}`, injectTo: "head" },
        { tag: "link", attrs: { rel: "icon", href: favicon(brand.theme.bg, brand.theme.accent, brand.name) }, injectTo: "head" },
      ];
    },
  };
}

/** The site must never ship the name, city, url or logo of a partner who has not confirmed in writing (SPEC §1). */
function redactUnconfirmedPartners(): Plugin {
  return {
    name: "kiver-redact-partners",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith("/data/shared/partners.json")) return null;
      const data = JSON.parse(code);
      data.partners = data.partners.map((p: Record<string, unknown>) =>
        p.confirmed === true ? p : { ...p, name: null, city: null, url: null, logo: null },
      );
      return JSON.stringify(data);
    },
  };
}

export default defineConfig({
  // "/" for igorbuildshouses.com, "/build/" under kiver.org (SPEC §13)
  base: process.env.VITE_BASE ?? "/",
  plugins: [brandHtml(), redactUnconfirmedPartners()],
  build: { outDir: "dist" },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
