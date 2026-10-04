// npm run export-csv: writes one schedule CSV per model and language into exports/ (git-ignored).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scheduleCsv } from "../src/lib/csv";
import { MODEL_IDS, type Model } from "../src/lib/types";

const root = fileURLToPath(new URL("..", import.meta.url));
mkdirSync(root + "exports", { recursive: true });
for (const id of MODEL_IDS) {
  const model = JSON.parse(readFileSync(`${root}data/models/${id}.json`, "utf8")) as Model;
  for (const lang of ["pt", "en"] as const) {
    const file = `exports/${id}-${lang}.csv`;
    writeFileSync(root + file, scheduleCsv(model, lang));
    console.log(file, `${model.activities.length} activities`);
  }
}
