/// <reference types="vitest/config" />
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const readJson = (rel: string) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8"));

const SLUGS: Record<string, string> = { k64: "64", k96: "96", k96pro: "96-pro", k144pro: "144-pro", k144max: "144-max" };

/** Absolute site URL for Open Graph images: VITE_SITE_URL, else Cloudflare's CF_PAGES_URL, else relative. */
const siteUrl = () => (process.env.VITE_SITE_URL ?? process.env.CF_PAGES_URL ?? "").replace(/\/+$/, "");

type Meta = { title: string; description: string; image: string };
function metaTags(m: Meta, base: string, brandName: string): { tag: string; attrs?: Record<string, string>; children?: string; injectTo: "head" }[] {
  const abs = (p: string) => `${siteUrl()}${base.replace(/\/$/, "")}${p}`;
  const meta = (attrs: Record<string, string>) => ({ tag: "meta", attrs, injectTo: "head" as const });
  return [
    { tag: "title", children: m.title, injectTo: "head" },
    meta({ name: "description", content: m.description }),
    meta({ property: "og:site_name", content: brandName }),
    meta({ property: "og:type", content: "website" }),
    meta({ property: "og:title", content: m.title }),
    meta({ property: "og:description", content: m.description }),
    meta({ property: "og:image", content: abs(m.image) }),
    meta({ property: "og:locale", content: "pt_BR" }),
    meta({ property: "og:locale:alternate", content: "en_US" }),
    meta({ name: "twitter:card", content: "summary_large_image" }),
    meta({ name: "twitter:image", content: abs(m.image) }),
  ];
}

/** Inject <title>, description, Open Graph tags, theme-color and the brand CSS variables, so the page never flashes
 *  and nothing is hardcoded in CSS. */
function brandHtml(): Plugin {
  let base = "/";
  return {
    name: "kiver-brand-html",
    configResolved(c) {
      base = c.base;
    },
    transformIndexHtml() {
      const brand = readJson("./data/shared/brand.json");
      const vars: string[] = [];
      for (const [k, v] of Object.entries(brand.theme)) vars.push(`--${k.replace(/_/g, "-")}:${v}`);
      for (const [k, v] of Object.entries(brand.track_colors)) vars.push(`--track-${k}:${v}`);
      vars.push(`--font-label:${brand.fonts.label}`, `--font-body:${brand.fonts.body}`);
      return [
        ...metaTags({ title: brand.name, description: brand.description.pt, image: "/og/default.png" }, base, brand.name),
        { tag: "meta", attrs: { name: "theme-color", content: brand.theme.bg }, injectTo: "head" },
        { tag: "style", children: `:root{${vars.join(";")}}`, injectTo: "head" },
        { tag: "link", attrs: { rel: "icon", href: favicon(brand.theme.bg, brand.theme.accent, brand.name) }, injectTo: "head" },
      ];
    },
  };
}

/** One HTML shell per model (/64/, /96/ ...) carrying that model's title, description and Open Graph image, so a shared
 *  link previews correctly even though the app itself routes by hash. The shell loads the same app; main.tsx moves
 *  the visitor to /#/<slug>. */
function routeShells(): Plugin {
  let outDir = "dist", root = "", base = "/";
  return {
    name: "kiver-route-shells",
    apply: "build",
    configResolved(c) {
      outDir = c.build.outDir;
      root = c.root;
      base = c.base;
    },
    closeBundle() {
      const brand = readJson("./data/shared/brand.json");
      const index = readFileSync(`${root}/${outDir}/index.html`, "utf8");
      for (const [id, slug] of Object.entries(SLUGS)) {
        const model = readJson(`./data/models/${id}.json`);
        const meta: Meta = {
          title: `${model.name.pt} | ${brand.name}`,
          description: `${model.name.pt}: ${model.system_label.pt}, ${model.area_m2} m², ${model.working_days} dias úteis.`,
          image: `/og/${id}.png`,
        };
        const tags = metaTags(meta, base, brand.name)
          .map((t) => (t.tag === "title" ? `<title>${t.children}</title>` : `<meta ${Object.entries(t.attrs!).map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" ")} />`))
          .join("\n    ");
        let html = index
          .replace(/<title>[^<]*<\/title>/, "")
          .replace(/<meta (name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/g, "");
        html = html.replace("</head>", `    ${tags}\n    <meta name="kiver:route" content="/${slug}" />\n  </head>`);
        const file = `${root}/${outDir}/${slug}/index.html`;
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, html);
      }
    },
  };
}

/** Monogram favicon from the brand colours, inline so there is no extra request. */
function favicon(bg: string, accent: string, name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${bg}"/><text x="16" y="23" font-family="monospace" font-size="20" font-weight="700" text-anchor="middle" fill="${accent}">${name[0]}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
  plugins: [brandHtml(), routeShells(), redactUnconfirmedPartners()],
  build: { outDir: "dist" },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
