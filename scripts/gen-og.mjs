// Renders the Open Graph images (1200x630) into public/og/: one for the home page and one per model, in the brand
// colours, with text from data/. Not part of the build and not a dependency: it needs playwright-core and a
// Chromium (set CHROMIUM_PATH). Run: CHROMIUM_PATH=/path/to/chromium node scripts/gen-og.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const brand = read("data/shared/brand.json");
const ids = ["k64", "k96", "k96pro", "k144pro", "k144max"];
const t = brand.theme;

const card = ({ eyebrow, title, line1, line2 }) => `<!doctype html><html><body style="margin:0;width:1200px;height:630px;background:${t.bg};color:${t.text};font-family:${brand.fonts.label};position:relative;overflow:hidden">
<div style="position:absolute;left:0;top:0;bottom:0;width:14px;background:${t.accent}"></div>
<div style="position:absolute;left:80px;top:78px;font-size:26px;letter-spacing:.3em;text-transform:uppercase;color:${t.accent}">${eyebrow}</div>
<div style="position:absolute;left:80px;top:150px;right:80px;font-size:${title.length > 22 ? 78 : 112}px;line-height:1.05;font-weight:700;color:${t.text_strong}">${title}</div>
<div style="position:absolute;left:80px;bottom:150px;right:80px;font-size:38px;color:${t.accent}">${line1}</div>
<div style="position:absolute;left:80px;bottom:84px;right:80px;font-size:28px;color:${t.muted}">${line2}</div>
</body></html>`;

mkdirSync(new URL("../public/og/", import.meta.url), { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const max = read("data/models/k144max.json");
const jobs = [{ file: "default", html: card({ eyebrow: brand.name, title: brand.tagline.pt, line1: `O Max em ${max.working_days} dias úteis`, line2: brand.name }) }];
for (const id of ids) {
  const m = read(`data/models/${id}.json`);
  jobs.push({ file: id, html: card({ eyebrow: brand.name, title: m.name.pt, line1: `${m.working_days} dias úteis`, line2: `${m.system_label.pt}, ${m.area_m2} m²` }) });
}
for (const j of jobs) {
  await page.setContent(j.html);
  await page.screenshot({ path: new URL(`../public/og/${j.file}.png`, import.meta.url).pathname });
  console.log("public/og/" + j.file + ".png");
}
await browser.close();
